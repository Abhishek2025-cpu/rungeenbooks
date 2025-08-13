const Admin = require('../Models/Admin');

// Register Admin
exports.registerAdmin = async (req, res) => {
    try {
        const { name, email, number, city, password } = req.body;

        if (!name || !email || !number || !city || !password) {
            return res.status(400).json({ statusCode: 400, success: false, message: "All fields are required" });
        }

        // Check duplicate
        const existingAdmin = await Admin.findOne({ $or: [{ email }, { number }] });
        if (existingAdmin) {
            return res.status(400).json({ statusCode: 400, success: false, message: "Email or Number already exists" });
        }

        const newAdmin = await Admin.create({ name, email, number, city, password });

        res.status(201).json({ statusCode: 201, success: true, message: "Admin registered successfully", admin: newAdmin });
    } catch (error) {
        res.status(500).json({ statusCode: 500, success: false, message: "Failed to register admin", error: error.message });
    }
};

// Login Admin
exports.loginAdmin = async (req, res) => {
    try {
        const { emailOrNumber, password } = req.body;

        if (!emailOrNumber || !password) {
            return res.status(400).json({ statusCode: 400, success: false, message: "Email/Number and password are required" });
        }

        const admin = await Admin.findOne({ 
            $or: [{ email: emailOrNumber }, { number: emailOrNumber }] 
        });

        if (!admin || admin.password !== password) {
            return res.status(401).json({ statusCode: 401, success: false, message: "Invalid credentials" });
        }

        res.status(200).json({ statusCode: 200, success: true, message: "Login successful", admin });
    } catch (error) {
        res.status(500).json({ statusCode: 500, success: false, message: "Login failed", error: error.message });
    }
};

// Update Admin
exports.updateAdmin = async (req, res) => {
    try {
        const { id } = req.params;
        const updatedData = req.body;

        const updatedAdmin = await Admin.findByIdAndUpdate(id, updatedData, { new: true });
        if (!updatedAdmin) {
            return res.status(404).json({ statusCode: 404, success: false, message: "Admin not found" });
        }

        res.status(200).json({ statusCode: 200, success: true, message: "Admin updated successfully", admin: updatedAdmin });
    } catch (error) {
        res.status(500).json({ statusCode: 500, success: false, message: "Update failed", error: error.message });
    }
};

// Delete Admin
exports.deleteAdmin = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedAdmin = await Admin.findByIdAndDelete(id);

        if (!deletedAdmin) {
            return res.status(404).json({ statusCode: 404, success: false, message: "Admin not found" });
        }

        res.status(200).json({ statusCode: 200, success: true, message: "Admin deleted successfully" });
    } catch (error) {
        res.status(500).json({ statusCode: 500, success: false, message: "Delete failed", error: error.message });
    }
};
