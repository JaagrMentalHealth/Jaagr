const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin");
const generateToken = require("../utils/generateToken");

/**
 * Create New Admin (Only Master Admin or Super Admin can do this)
 */
exports.createAdmin = async (req, res) => {
  const { fullName, email, password, role } = req.body;

  // Check if a Super Admin already exists
  const existingSuperAdmin = await Admin.findOne({ role: "super_admin" });

  // If no Super Admin exists, allow anyone to create one when role is "super_admin"
  if (!existingSuperAdmin && role === "super_admin") {
    const superAdmin = await Admin.create({ fullName, email, password, role });
    if (superAdmin) {
      return res.status(201).json({ message: "Super Admin created successfully" });
    } else {
      return res.status(400).json({ message: "Error creating Super Admin" });
    }
  }

  // If Super Admin exists, only they can create a new Super Admin
  if (
    role === "super_admin" &&
    (!req.admin || req.admin.role !== "super_admin")
  ) {
    return res.status(403).json({
      message: "Only the existing Super Admin can create a new Super Admin",
    });
  }

  // If creating a new Super Admin, retire the current one
  if (role === "super_admin" && existingSuperAdmin) {
    await Admin.findByIdAndUpdate(existingSuperAdmin._id, {
      role: "retired_admin",
    });

    const newSuperAdmin = await Admin.create({
      fullName,
      email,
      password,
      role,
    });

    if (newSuperAdmin) {
      return res.status(201).json({
        message:
          "New Super Admin created. Previous Super Admin has been retired.",
      });
    } else {
      return res.status(400).json({ message: "Error creating new Super Admin" });
    }
  }

  // Only Master Admins and Super Admins can create new admins
  if (!["master_admin", "junior_admin"].includes(role)) {
    return res.status(400).json({ message: "Invalid role" });
  }
  console.log(req.admin.role);

  if (req.admin.role !== "master_admin" && req.admin.role !== "super_admin") {
    return res.status(403).json({
      message: "Only a Master Admin or a Super Admin can create new admins",
    });
  }

  // Check if the admin already exists
  const adminExists = await Admin.findOne({ email });
  if (adminExists)
    return res.status(400).json({ message: "Admin already exists" });

  // Create a new admin, also tracking the creator
  const admin = await Admin.create({
    fullName,
    email,
    password,
    role,
    createdBy: req.admin._id,
  });

  if (admin) {
    return res.status(201).json({ message: "Admin created successfully" });
  } else {
    return res.status(400).json({ message: "Invalid admin data" });
  }
};

/**
 * Get all Admins
 */
exports.getAdmins = async (req, res) => {
  try {
    // Fetch all admins while excluding passwords
    const admins = await Admin.find().select("-password");
    res.status(200).json(admins);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get Admin by ID
 */
// Fetch logged-in admin's own profile
exports.getMyProfile = async (req, res) => {
  try {
    if (!req.admin) {
      return res.status(401).json({ message: "Not authorized" });
    }

    res.status(200).json({
      _id: req.admin._id,
      fullName: req.admin.fullName,
      email: req.admin.email,
      role: req.admin.role,
      createdAt: req.admin.createdAt,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


/**
 * Update Admin (Only the Admin themselves can update)
 */
exports.updateAdmin = async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin._id);
    if (!admin) return res.status(404).json({ message: "Admin not found" });
  
    admin.fullName = req.body.fullName || admin.fullName;
    admin.email = req.body.email || admin.email;
  
    if (req.body.password) admin.password = req.body.password;
  
    await admin.save();
    res.json({ message: "Admin updated successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Delete Admin (Only Master Admins can delete other admins; cannot delete Super Admins or yourself)
 */
exports.deleteAdmin = async (req, res) => {
  try {
    const admin = await Admin.findById(req.params.id);
    if (!admin) return res.status(404).json({ message: "Admin not found" });
  
    if (admin.role === "super_admin") {
      return res.status(404).json({ message: "Super Admins cannot be deleted" });
    }
  
    if (admin._id.toString() === req.admin._id.toString()) {
      return res.status(404).json({ message: "You cannot delete yourself" });
    }
  
    await admin.remove();
    res.json({ message: "Admin deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
