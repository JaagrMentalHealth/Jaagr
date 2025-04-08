const Organisation = require('../models/organisation.model');
const OrgUser=require('../models/orgUser')
const Assessment=require('../models/Assessment')

// Create
exports.createOrganisation = async (req, res) => {
  try {
    const organisation = new Organisation(req.body);
    await organisation.save();
    res.status(201).json(organisation);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Read All
exports.getAllOrganisations = async (req, res) => {
  try {
    const organisations = await Organisation.find();
    res.status(200).json(organisations);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Read by ID
exports.getOrganisationById = async (req, res) => {
  try {
    const organisation = await Organisation.findById(req.params.id);
    if (!organisation) return res.status(404).json({ error: 'Organisation not found' });
    res.status(200).json(organisation);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update
exports.updateOrganisation = async (req, res) => {
  try {
    const updated = await Organisation.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!updated) return res.status(404).json({ error: 'Organisation not found' });
    res.status(200).json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Delete
exports.deleteOrganisation = async (req, res) => {
  try {
    const organizationId = req.params.id;

    // Delete the organisation
    const deleted = await Organisation.findByIdAndDelete(organizationId);
    if (!deleted) return res.status(404).json({ error: "Organisation not found" });

    // Delete all users associated with the organisation
    await OrgUser.deleteMany({ organizationId });

    await Assessment.deleteMany({ organizationId });

    res.status(200).json({ message: "Organisation and its users deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
