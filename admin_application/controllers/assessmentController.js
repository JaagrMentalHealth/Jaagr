const Assessment = require("../models/Assessment")
const ExcelJS = require("exceljs");
const OrgUser = require("../models/orgUser");
const AssessmentOutcome = require("../../assessment_v2/models/assessmentOutcome");
const Organisation = require("../models/organisation.model");

// Create Assessment under an organization
exports.createAssessment = async (req, res) => {
  try {
    const {
      name,
      type,
      description,
      duration,
      validUntil,
      organizationId,
    } = req.body

    const newAssessment = await Assessment.create({
      name,
      type,
      description,
      duration,
      validUntil,
      organizationId,
    })

    res.status(201).json(newAssessment)
  } catch (error) {
    res.status(400).json({ error: "Failed to create assessment", details: error.message })
  }
}

// Optional: Get all assessments under an org
exports.getAssessmentsByOrg = async (req, res) => {
  try {
    const assessments = await Assessment.find({ organizationId: req.params.orgId })
    res.status(200).json(assessments)
  } catch (error) {
    res.status(400).json({ error: "Failed to fetch assessments", details: error.message })
  }
}



exports.exportAssessmentReport = async (req, res) => {
  try {
    const { assessmentId } = req.params;

    const orgUsers = await OrgUser.find({ assessmentId }).populate("organizationId");
    // console.log(orgUsers)
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Assessment Report");

    worksheet.columns = [
      { header: "Name", key: "fullName", width: 25 },
      { header: "Email", key: "email", width: 30 },
      { header: "Phone", key: "phone", width: 20 },
      { header: "Status", key: "status", width: 20 },
      { header: "Report Link", key: "report", width: 50 },
    ];

    for (const user of orgUsers) {
      const hasGiven = await AssessmentOutcome.findOne({ userId: user._id });
      // console.log(user._id,hasGiven)

      worksheet.addRow({
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        status: hasGiven ? "Completed" : "Not Attempted",
        report: hasGiven
          ? `${process.env.FRONTEND_URL}/assessment-result?outcomeId=${hasGiven._id}`
          : "N/A",
      });
    }

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=assessment_report_${assessmentId}.xlsx`
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error("Export Error:", err);
    res.status(500).send("Failed to generate report");
  }
};