import express from "express";
import mongoose from "mongoose";
import Student from "../models/Student.js";
import {
    Document,
    Packer,
    Paragraph,
    TextRun,
    Table,
    TableRow,
    TableCell,
    WidthType,
    BorderStyle,
    AlignmentType,
    HeadingLevel
} from "docx";
import ExcelJS from "exceljs";

const router = express.Router();

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[0-9]{10}$/;

const ALLOWED_SORT_FIELDS = [
    "studentId",
    "name",
    "age",
    "className",
    "section"
];

const ALLOWED_GENDERS = ["Male", "Female", "Others"];

function escapeRegex(value) {
    return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function validateStudentData(data) {
    const errors = {};

    const studentId = String(data.studentId ?? "").trim();
    const name = String(data.name ?? "").trim();
    const age = Number(data.age);
    const gender = String(data.gender ?? "").trim();
    const className = String(data.className ?? "").trim();
    const section = String(data.section ?? "").trim().toUpperCase();
    const email = String(data.email ?? "").trim().toLowerCase();
    const phone = String(data.phone ?? "").trim();
    const address = String(data.address ?? "").trim();

    if (!studentId) {
        errors.studentId = "Student ID is required";
    } else if (studentId.length < 4 || studentId.length > 10) {
        errors.studentId = "Student ID must be between 4 and 10 characters";
    }

    if (!name) {
        errors.name = "Name is required";
    } else if (name.length < 2) {
        errors.name = "Name must be at least 2 characters";
    }

    if (!Number.isInteger(age) || age < 5 || age > 25) {
        errors.age = "Age must be between 5 and 25";
    }

    if (!ALLOWED_GENDERS.includes(gender)) {
        errors.gender = "Gender must be Male, Female, or Others";
    }

    if (!className) {
        errors.className = "Class is required";
    }

    if (!section) {
        errors.section = "Section is required";
    }

    if (!EMAIL_REGEX.test(email)) {
        errors.email = "Please enter a valid email address";
    }

    if (!PHONE_REGEX.test(phone)) {
        errors.phone = "Phone number must be exactly 10 digits";
    }

    if (!address) {
        errors.address = "Address is required";
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors,
        cleanedData: {
            studentId,
            name,
            age,
            gender,
            className,
            section,
            email,
            phone,
            address
        }
    };
}

function buildFilter(query) {
    const filter = {};

    if (query.className) {
        filter.className = String(query.className).trim();
    }

    if (query.section) {
        filter.section = String(query.section).trim().toUpperCase();
    }

    if (query.search) {
        const search = String(query.search).trim();

        if (search) {
            const safeSearch = escapeRegex(search);

            filter.$or = [
                { studentId: { $regex: safeSearch, $options: "i" } },
                { name: { $regex: safeSearch, $options: "i" } }
            ];
        }
    }

    return filter;
}

function getErrorMessage(error) {
    if (error?.code === 11000) {
        return "Student ID already exists.";
    }

    if (error?.name === "ValidationError") {
        const messages = Object.values(error.errors).map(
            (item) => item.message
        );

        return messages.join(" | ");
    }

    return error?.message || "An unexpected error occurred.";
}

function normalizeStudent(student) {
    return {
        _id: student._id,
        studentId: student.studentId,
        name: student.name,
        age: student.age,
        gender: student.gender,
        className: student.className,
        section: student.section,
        email: student.email,
        phone: student.phone,
        address: student.address,
        createdAt: student.createdAt,
        updatedAt: student.updatedAt
    };
}

// ============================================================
// DOWNLOAD WORD
// IMPORTANT: These routes are before GET /:id.
// ============================================================

router.get("/download/word", async (req, res) => {
    try {
        const filter = buildFilter(req.query);
        const students = await Student.find(filter)
            .sort({ className: 1, section: 1, name: 1 })
            .lean();

        if (students.length === 0) {
            return res.status(404).json({
                message: "No student records found for the selected filter."
            });
        }

        const children = [
            new Paragraph({
                text: "SCHOOL STUDENT MANAGEMENT SYSTEM",
                heading: HeadingLevel.TITLE,
                alignment: AlignmentType.CENTER
            }),
            new Paragraph({
                text: `Student Records Report | Total Students: ${students.length}`,
                alignment: AlignmentType.CENTER
            }),
            new Paragraph({ text: "" })
        ];

        students.forEach((student, index) => {
            children.push(
                new Paragraph({
                    children: [
                        new TextRun({
                            text: `Student ${index + 1}`,
                            bold: true,
                            size: 28
                        })
                    ],
                    spacing: { before: 200, after: 100 }
                })
            );

            const rows = [
                ["Student ID", student.studentId],
                ["Name", student.name],
                ["Age", String(student.age)],
                ["Gender", student.gender],
                ["Class", student.className],
                ["Section", student.section],
                ["Email", student.email],
                ["Phone", student.phone],
                ["Address", student.address]
            ];

            const tableRows = rows.map(
                ([label, value]) =>
                    new TableRow({
                        children: [
                            new TableCell({
                                width: {
                                    size: 30,
                                    type: WidthType.PERCENTAGE
                                },
                                children: [
                                    new Paragraph({
                                        children: [
                                            new TextRun({
                                                text: label,
                                                bold: true
                                            })
                                        ]
                                    })
                                ]
                            }),
                            new TableCell({
                                width: {
                                    size: 70,
                                    type: WidthType.PERCENTAGE
                                },
                                children: [
                                    new Paragraph({
                                        text: String(value ?? "")
                                    })
                                ]
                            })
                        ]
                    })
            );

            children.push(
                new Table({
                    width: {
                        size: 100,
                        type: WidthType.PERCENTAGE
                    },
                    borders: {
                        top: {
                            style: BorderStyle.SINGLE,
                            size: 1
                        },
                        bottom: {
                            style: BorderStyle.SINGLE,
                            size: 1
                        },
                        left: {
                            style: BorderStyle.SINGLE,
                            size: 1
                        },
                        right: {
                            style: BorderStyle.SINGLE,
                            size: 1
                        },
                        insideHorizontal: {
                            style: BorderStyle.SINGLE,
                            size: 1
                        },
                        insideVertical: {
                            style: BorderStyle.SINGLE,
                            size: 1
                        }
                    },
                    rows: tableRows
                })
            );
        });

        const document = new Document({
            sections: [
                {
                    properties: {},
                    children
                }
            ]
        });

        const buffer = await Packer.toBuffer(document);

        res.setHeader(
            "Content-Type",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        );
        res.setHeader(
            "Content-Disposition",
            'attachment; filename="student-data.docx"'
        );

        return res.send(buffer);
    } catch (error) {
        console.error("Word export error:", error);

        return res.status(500).json({
            message: "Unable to generate Word file."
        });
    }
});

// ============================================================
// DOWNLOAD EXCEL
// ============================================================

router.get("/download/excel", async (req, res) => {
    try {
        const filter = buildFilter(req.query);

        const students = await Student.find(filter)
            .sort({ className: 1, section: 1, name: 1 })
            .lean();

        if (students.length === 0) {
            return res.status(404).json({
                message: "No student records found for the selected filter."
            });
        }

        const workbook = new ExcelJS.Workbook();

        workbook.creator = "School Student Management System";
        workbook.created = new Date();

        const worksheet = workbook.addWorksheet("Students");

        worksheet.mergeCells("A1:I1");
        worksheet.getCell("A1").value =
            "SCHOOL STUDENT MANAGEMENT SYSTEM";

        worksheet.getCell("A1").font = {
            bold: true,
            size: 16,
            color: { argb: "FFFFFFFF" }
        };

        worksheet.getCell("A1").alignment = {
            horizontal: "center",
            vertical: "middle"
        };

        worksheet.getCell("A1").fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "1E5096" }
        };

        worksheet.getRow(1).height = 28;

        worksheet.mergeCells("A2:I2");
        worksheet.getCell("A2").value =
            `Student Records Report | Total Students: ${students.length}`;

        worksheet.getCell("A2").font = {
            italic: true,
            size: 11
        };

        worksheet.getCell("A2").alignment = {
            horizontal: "center"
        };

        const headers = [
            "Student ID",
            "Name",
            "Age",
            "Gender",
            "Class",
            "Section",
            "Email",
            "Phone",
            "Address"
        ];

        const headerRow = worksheet.getRow(4);
        headerRow.values = headers;

        headerRow.font = {
            bold: true,
            color: { argb: "FFFFFFFF" }
        };

        headerRow.alignment = {
            horizontal: "center",
            vertical: "middle"
        };

        headerRow.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "4472C4" }
        };

        headerRow.height = 24;

        students.forEach((student, index) => {
            const row = worksheet.addRow([
                student.studentId,
                student.name,
                student.age,
                student.gender,
                student.className,
                student.section,
                student.email,
                student.phone,
                student.address
            ]);

            if (index % 2 === 0) {
                row.fill = {
                    type: "pattern",
                    pattern: "solid",
                    fgColor: { argb: "F2F6FC" }
                };
            }

            row.alignment = {
                vertical: "middle"
            };
        });

        worksheet.columns = [
            { width: 15 },
            { width: 25 },
            { width: 10 },
            { width: 12 },
            { width: 10 },
            { width: 12 },
            { width: 30 },
            { width: 16 },
            { width: 35 }
        ];

        worksheet.autoFilter = {
            from: "A4",
            to: "I4"
        };

        worksheet.views = [
            {
                state: "frozen",
                ySplit: 4
            }
        ];

        worksheet.pageSetup = {
            orientation: "landscape",
            fitToPage: true,
            fitToWidth: 1,
            fitToHeight: 0
        };

        const buffer = await workbook.xlsx.writeBuffer();

        res.setHeader(
            "Content-Type",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );
        res.setHeader(
            "Content-Disposition",
            'attachment; filename="student-data.xlsx"'
        );

        return res.send(buffer);
    } catch (error) {
        console.error("Excel export error:", error);

        return res.status(500).json({
            message: "Unable to generate Excel file."
        });
    }
});

// ============================================================
// CREATE STUDENT
// ============================================================

router.post("/", async (req, res) => {
    try {
        const validation = validateStudentData(req.body);

        if (!validation.isValid) {
            return res.status(400).json({
                message: "Please correct the following fields.",
                errors: validation.errors
            });
        }

        const existingStudent = await Student.findOne({
            studentId: validation.cleanedData.studentId
        });

        if (existingStudent) {
            return res.status(409).json({
                message: "Student ID already exists."
            });
        }

        const student = await Student.create(validation.cleanedData);

        return res.status(201).json({
            message: "Student added successfully.",
            student: normalizeStudent(student)
        });
    } catch (error) {
        console.error("Create student error:", error);

        return res.status(500).json({
            message: getErrorMessage(error)
        });
    }
});

// ============================================================
// GET ALL STUDENTS
// ============================================================

router.get("/", async (req, res) => {
    try {
        const page = Math.max(
            Number.parseInt(req.query.page, 10) || 1,
            1
        );

        const limit = Math.min(
            Math.max(
                Number.parseInt(req.query.limit, 10) || 8,
                1
            ),
            100
        );

        const filter = buildFilter(req.query);

        const sortBy = ALLOWED_SORT_FIELDS.includes(req.query.sortBy)
            ? req.query.sortBy
            : "createdAt";

        const order = req.query.order === "desc" ? -1 : 1;

        const totalCount = await Student.countDocuments(filter);

        const totalPages = Math.max(
            Math.ceil(totalCount / limit),
            1
        );

        const safePage = Math.min(page, totalPages);

        const students = await Student.find(filter)
            .sort({ [sortBy]: order })
            .skip((safePage - 1) * limit)
            .limit(limit)
            .lean();

        return res.json({
            students,
            totalCount,
            totalPages,
            currentPage: safePage,
            pageSize: limit
        });
    } catch (error) {
        console.error("Get students error:", error);

        return res.status(500).json({
            message: "Unable to fetch student data."
        });
    }
});

// ============================================================
// GET ONE STUDENT
// ============================================================

router.get("/:id", async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                message: "Invalid student ID."
            });
        }

        const student = await Student.findById(id).lean();

        if (!student) {
            return res.status(404).json({
                message: "Student not found."
            });
        }

        return res.json(student);
    } catch (error) {
        console.error("Get student error:", error);

        return res.status(500).json({
            message: "Unable to fetch student."
        });
    }
});

// ============================================================
// UPDATE STUDENT
// ============================================================

router.put("/:id", async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                message: "Invalid student ID."
            });
        }

        const validation = validateStudentData(req.body);

        if (!validation.isValid) {
            return res.status(400).json({
                message: "Please correct the following fields.",
                errors: validation.errors
            });
        }

        const duplicateStudent = await Student.findOne({
            studentId: validation.cleanedData.studentId,
            _id: { $ne: id }
        });

        if (duplicateStudent) {
            return res.status(409).json({
                message: "Student ID already exists."
            });
        }

        const updatedStudent = await Student.findByIdAndUpdate(
            id,
            validation.cleanedData,
            {
                new: true,
                runValidators: true
            }
        ).lean();

        if (!updatedStudent) {
            return res.status(404).json({
                message: "Student not found."
            });
        }

        return res.json({
            message: "Student updated successfully.",
            student: updatedStudent
        });
    } catch (error) {
        console.error("Update student error:", error);

        return res.status(500).json({
            message: getErrorMessage(error)
        });
    }
});

// ============================================================
// DELETE STUDENT
// ============================================================

router.delete("/:id", async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                message: "Invalid student ID."
            });
        }

        const deletedStudent = await Student.findByIdAndDelete(id);

        if (!deletedStudent) {
            return res.status(404).json({
                message: "Student not found."
            });
        }

        return res.json({
            message: "Student deleted successfully."
        });
    } catch (error) {
        console.error("Delete student error:", error);

        return res.status(500).json({
            message: "Unable to delete student."
        });
    }
});

export default router;
