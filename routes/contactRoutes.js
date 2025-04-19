const express = require("express");
const router = express.Router();
const contactCtrl = require("../controllers/contactController");

// Create / List
router
  .route("/")
  .post(contactCtrl.createContact)
  .get(contactCtrl.getAllContacts);

// Read / Update / Delete by ID (Mongo _id or numeric referenceId)
router
  .route("/:id")
  .get(contactCtrl.getContactById)
  .patch(contactCtrl.updateContact)
  .delete(contactCtrl.deleteContact);

module.exports = router;