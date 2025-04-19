const Contact = require("../models/Contact");
const { Mailer } = require("../utils/mailer");

/**
 * Create a new contact request, save to DB, send acknowledgment email.
 */
exports.createContact = async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    // 1) Save to database
    const contact = await Contact.create({ name, email, subject, message });

    // 2) Send acknowledgment email
    const ackText = `
Hi ${name},

Thank you for reaching out! We have received your query (Ref: ${contact.referenceId}).
Our team will get back to you within 24–72 hours.

Your subject: ${subject}
Your message: ${message}

Thanks,
The Support Team
`;
    await Mailer(email, ackText, "We’ve Received Your Query");

    // 3) Return JSON (for API) or render a success view
    return res.status(201).json({
      status: "success",
      data: {
        contact,
      },
    });
  } catch (err) {
    console.error("createContact error:", err);
    return res.status(500).json({ status: "error", message: err.message });
  }
};

/**
 * Fetch all contact requests (optionally filtered by status or date).
 */
exports.getAllContacts = async (req, res) => {
  try {
    // you can accept query params: ?status=pending
    const filter = {};
    if (req.query.status) filter.status = req.query.status;

    const contacts = await Contact.find(filter).sort({ createdAt: -1 });
    return res.status(200).json({
      status: "success",
      results: contacts.length,
      data: { contacts },
    });
  } catch (err) {
    console.error("getAllContacts error:", err);
    return res.status(500).json({ status: "error", message: err.message });
  }
};

/**
 * Fetch a single contact by its Mongo ID or by its numeric referenceId.
 */
exports.getContactById = async (req, res) => {
  try {
    const { id } = req.params;

    // allow either Mongo _id or numeric referenceId
    const query = mongoose.Types.ObjectId.isValid(id)
      ? { _id: id }
      : { referenceId: Number(id) };

    const contact = await Contact.findOne(query);
    if (!contact) {
      return res.status(404).json({ status: "fail", message: "Not found" });
    }

    return res.status(200).json({ status: "success", data: { contact } });
  } catch (err) {
    console.error("getContactById error:", err);
    return res.status(500).json({ status: "error", message: err.message });
  }
};

/**
 * Update a contact's status or message.
 */
exports.updateContact = async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body; // e.g. { status: "completed" }
  
      // 1) Fetch the existing record so we can compare statuses
      const existing = await Contact.findById(id);
      if (!existing) {
        return res.status(404).json({ status: "fail", message: "Not found" });
      }
  
      // 2) Apply updates (but don’t change referenceId)
      delete updates.referenceId;
      const updated = await Contact.findByIdAndUpdate(id, updates, {
        new: true,
        runValidators: true,
      });
  
      // 3) If status just changed to "completed", send resolution email
      if (
        updates.status === "completed" &&
        existing.status !== "completed"
      ) {
        const { name, email, referenceId } = updated;
        const text = `
  Hi ${name},
  
  Good news! Your support request (Reference ID: ${referenceId}) has now been resolved.
  
  Thank you for your patience. If you have any further questions, feel free to reach out.
  
  Warm regards,
  The Support Team
  `;
        await Mailer(email, text, "Your query has been resolved");
      }
  
      // 4) Return the updated contact
      return res.status(200).json({
        status: "success",
        data: { contact: updated },
      });
    } catch (err) {
      console.error("updateContact error:", err);
      return res.status(500).json({ status: "error", message: err.message });
    }
  };

/**
 * Delete a contact request.
 */
exports.deleteContact = async (req, res) => {
  try {
    const { id } = req.params;
    const contact = await Contact.findByIdAndDelete(id);
    if (!contact) {
      return res.status(404).json({ status: "fail", message: "Not found" });
    }
    return res.status(204).send(); // no content
  } catch (err) {
    console.error("deleteContact error:", err);
    return res.status(500).json({ status: "error", message: err.message });
  }
};
