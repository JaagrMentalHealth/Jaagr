const User = require("../../models/User");
const AssessmentOutcome = require("../../assessment_v2/models/assessmentOutcome");
const AssessmentTypes = require("../../assessment_v2/models/Assessment");

exports.getDashboardSummary = async (req, res) => {
  try {
    // 1. Totals
    const [totalUsers, totalAssessments] = await Promise.all([
      User.countDocuments({
        $or: [
          { ghost: false },
          { ghost: { $exists: false } }, // field missing
          { ghost: null }, // field is explicitly null
        ],
      }),
      AssessmentTypes.countDocuments(),
    ]);

    // 2. Fetch all users (for chart + recent users)
    const allUsers = await User.find({
        $or: [
          { ghost: false },
          { ghost: { $exists: false } }, // field missing
          { ghost: null }, // field is explicitly null
        ],
      }).sort({ createdAt: 1 });

    // 3. Fetch outcomes for completed/pending count
    const allOutcomes = await AssessmentOutcome.find();
    let completedAssessments = 0;
    let pendingAssessments = 0;

    allOutcomes.forEach((a) => {
      const hasResults = Array.isArray(a.results) && a.results.length > 0;
      if (a.complete || hasResults) {
        completedAssessments += 1;
      } else {
        pendingAssessments += 1;
      }
    });

    // 4. Fetch 5 recent users
    const recentUsersRaw = await User.find({
        $or: [
          { ghost: false },
          { ghost: { $exists: false } }, // field missing
          { ghost: null }, // field is explicitly null
        ],
      })
      .sort({ createdAt: -1 })
      .limit(5)
      .select("_id userName email createdAt");

    const recentUserIds = recentUsersRaw.map((u) => u._id);
    const recentOutcomes = await AssessmentOutcome.find({
      userId: { $in: recentUserIds },
    });

    const recentUsers = recentUsersRaw.map((user) => {
      const userOutcomes = recentOutcomes.filter(
        (o) => o.userId.toString() === user._id.toString()
      );
      const hasCompleted = userOutcomes.some((o) => o.complete);
      return {
        _id: user._id,
        userName: user.userName,
        email: user.email,
        createdAt: user.createdAt,
        status: hasCompleted ? "Completed" : "Pending",
      };
    });

    // 5. Month-wise user registration chart starting from Jan 2025
    const userMonthCounts = {};

    allUsers.forEach((user) => {
      if (user.createdAt) {
        const date = new Date(user.createdAt);
        const monthKey = date.toLocaleString("default", {
          month: "short",
          year: "numeric",
        }); // e.g., "Feb 2025"
        userMonthCounts[monthKey] = (userMonthCounts[monthKey] || 0) + 1;
      }
    });

    const firstDate = new Date("2025-01-01"); // Start from Jan 2025
    const lastDate = new Date(
      allUsers[allUsers.length - 1]?.createdAt || new Date()
    );
    firstDate.setDate(1);
    lastDate.setDate(1);

    const monthList = [];
    const current = new Date(firstDate);

    while (current <= lastDate) {
      const label = current.toLocaleString("default", {
        month: "short",
        year: "numeric",
      });
      monthList.push(label);
      current.setMonth(current.getMonth() + 1);
    }

    const userChartData = monthList.map((label) => ({
      label,
      count: userMonthCounts[label] || 0,
    }));

    // 6. Final Response
    res.json({
      totalUsers,
      totalAssessments,
      completedAssessments,
      pendingAssessments,
      recentUsers,
      userChartData, // ✅ chart includes 0s starting Jan 2025
    });
  } catch (err) {
    console.error("Error in dashboard summary:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};
