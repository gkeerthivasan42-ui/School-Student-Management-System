import mongoose from "mongoose";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[0-9]{10}$/;

const studentSchema = new mongoose.Schema(
    {
        studentId: {
            type: String,
            required: [true, "Student ID is required"],
            unique: true,
            trim: true,
            minlength: [4, "Student ID must be at least 4 characters"],
            maxlength: [10, "Student ID must be at most 10 characters"]
        },

        name: {
            type: String,
            required: [true, "Name is required"],
            trim: true,
            minlength: [2, "Name must be at least 2 characters"]
        },

        age: {
            type: Number,
            required: [true, "Age is required"],
            min: [5, "Age must be at least 5"],
            max: [25, "Age must be at most 25"]
        },

        gender: {
            type: String,
            required: [true, "Gender is required"],
            enum: {
                values: ["Male", "Female", "Others"],
                message: "Gender must be Male, Female, or Others"
            }
        },

        className: {
            type: String,
            required: [true, "Class is required"],
            trim: true
        },

        section: {
            type: String,
            required: [true, "Section is required"],
            trim: true,
            uppercase: true
        },

        email: {
            type: String,
            required: [true, "Email is required"],
            trim: true,
            lowercase: true,
            match: [EMAIL_REGEX, "Please enter a valid email address"]
        },

        phone: {
            type: String,
            required: [true, "Phone number is required"],
            trim: true,
            match: [PHONE_REGEX, "Phone number must be exactly 10 digits"]
        },

        address: {
            type: String,
            required: [true, "Address is required"],
            trim: true
        }
    },
    {
        timestamps: true
    }
);

export default mongoose.model("Student", studentSchema);
