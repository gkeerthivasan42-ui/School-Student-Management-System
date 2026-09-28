// ============================================================
// SCHOOL STUDENT MANAGEMENT SYSTEM
// FRONTEND JAVASCRIPT
// ============================================================

const API_URL = "http://localhost:5000/api/students";
const PAGE_SIZE = 8;

// ============================================================
// TABLE STATE
// ============================================================

let currentPage = 1;
let currentSortField = null;
let currentSortOrder = "asc";
let currentSearchText = "";
let currentClassFilter = "";
let cachedStudents = [];
let searchDebounceTimer = null;

// ============================================================
// DOM ELEMENTS
// ============================================================

const studentForm = document.getElementById("studentForm");
const editStudentForm = document.getElementById("editStudentForm");
const searchInput = document.getElementById("searchInput");
const classFilter = document.getElementById("classFilter");

// ============================================================
// COMMON HELPERS
// ============================================================

function showMessage(message) {
    alert(message);
}

async function getResponseData(response) {
    try {
        return await response.json();
    } catch (error) {
        return {};
    }
}

function escapeHTML(value) {
    if (value === null || value === undefined) {
        return "";
    }

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function escapeAttribute(value) {
    return escapeHTML(value);
}

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        String(email).trim()
    );
}

function isValidPhone(phone) {
    return /^[0-9]{10}$/.test(
        String(phone).trim()
    );
}

function buildListQuery(page) {
    const params = new URLSearchParams();

    params.set("page", page);
    params.set("limit", PAGE_SIZE);

    if (currentSortField) {
        params.set("sortBy", currentSortField);
        params.set("order", currentSortOrder);
    }

    if (currentSearchText) {
        params.set("search", currentSearchText);
    }

    if (currentClassFilter) {
        params.set("className", currentClassFilter);
    }

    return params.toString();
}

function getSelectedGender(name) {
    return document.querySelector(
        `input[name="${name}"]:checked`
    );
}

// ============================================================
// ADD STUDENT
// ============================================================

studentForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!studentForm.checkValidity()) {
        studentForm.reportValidity();
        return;
    }

    const selectedGender = getSelectedGender("gender");

    if (!selectedGender) {
        showMessage("Please select a gender.");
        return;
    }

    const studentData = {
        studentId: document.getElementById("studentId").value.trim(),
        name: document.getElementById("name").value.trim(),
        age: Number(document.getElementById("age").value),
        gender: selectedGender.value,
        className: document.getElementById("className").value,
        section: document.getElementById("section").value,
        email: document.getElementById("email").value.trim(),
        phone: document.getElementById("phone").value.trim(),
        address: document.getElementById("address").value.trim()
    };

    if (!isValidEmail(studentData.email)) {
        showMessage("Please enter a valid email address.");
        return;
    }

    if (!isValidPhone(studentData.phone)) {
        showMessage("Please enter a valid 10-digit phone number.");
        return;
    }

    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(studentData)
        });

        const data = await getResponseData(response);

        if (!response.ok) {
            showMessage(
                data.message || "Error adding student."
            );
            return;
        }

        showMessage("Student added successfully!");

        studentForm.reset();

        currentSearchText = "";
        currentClassFilter = "";

        searchInput.value = "";
        classFilter.value = "";

        await loadStudents(1);
    } catch (error) {
        console.error("Error adding student:", error);

        showMessage(
            "Cannot connect to backend. Please make sure the server is running."
        );
    }
});

// ============================================================
// LOAD STUDENTS
// ============================================================

async function loadStudents(page = 1) {
    try {
        const query = buildListQuery(page);

        const response = await fetch(
            `${API_URL}?${query}`
        );

        if (!response.ok) {
            const data = await getResponseData(response);

            throw new Error(
                data.message || "Unable to fetch student data."
            );
        }

        const data = await response.json();

        const students = Array.isArray(data)
            ? data
            : data.students || [];

        const totalCount = Array.isArray(data)
            ? students.length
            : Number(data.totalCount) || 0;

        const totalPages = Array.isArray(data)
            ? 1
            : Number(data.totalPages) || 1;

        const serverPage = Array.isArray(data)
            ? 1
            : Number(data.currentPage) || page;

        currentPage = serverPage;
        cachedStudents = students;

        document.getElementById("studentCount").textContent =
            totalCount;

        const tableBody =
            document.getElementById("studentTableBody");

        tableBody.innerHTML = "";

        if (students.length === 0) {
            const row = document.createElement("tr");

            row.innerHTML = `
                <td colspan="10" class="empty-row">
                    No student records found.
                </td>
            `;

            tableBody.appendChild(row);
        } else {
            students.forEach((student) => {
                const row = document.createElement("tr");

                const id = escapeAttribute(student._id);

                row.innerHTML = `
                    <td>${escapeHTML(student.studentId)}</td>
                    <td>${escapeHTML(student.name)}</td>
                    <td>${escapeHTML(student.age)}</td>
                    <td>${escapeHTML(student.gender)}</td>
                    <td>${escapeHTML(student.className)}</td>
                    <td>${escapeHTML(student.section)}</td>
                    <td>${escapeHTML(student.email)}</td>
                    <td>${escapeHTML(student.phone)}</td>
                    <td>${escapeHTML(student.address)}</td>
                    <td class="action-cell">
                        <button
                            type="button"
                            class="edit-button"
                            data-id="${id}"
                        >
                            Edit
                        </button>

                        <button
                            type="button"
                            class="delete-button"
                            data-id="${id}"
                        >
                            Delete
                        </button>
                    </td>
                `;

                row.querySelector(".edit-button")
                    .addEventListener("click", () => {
                        editStudent(student._id);
                    });

                row.querySelector(".delete-button")
                    .addEventListener("click", () => {
                        deleteStudent(student._id);
                    });

                tableBody.appendChild(row);
            });
        }

        renderPagination(totalPages, currentPage);
        updateSortIndicators();
    } catch (error) {
        console.error("Error loading students:", error);

        showMessage(
            error.message ||
            "Unable to load student data. Please check the backend server."
        );
    }
}

// ============================================================
// PAGINATION
// ============================================================

function renderPagination(totalPages, page) {
    const container =
        document.getElementById("paginationContainer");

    container.innerHTML = "";

    if (!totalPages || totalPages <= 1) {
        return;
    }

    const prevButton = document.createElement("button");

    prevButton.type = "button";
    prevButton.textContent = "Prev";
    prevButton.disabled = page <= 1;

    prevButton.addEventListener("click", () => {
        loadStudents(page - 1);
    });

    container.appendChild(prevButton);

    for (let i = 1; i <= totalPages; i++) {
        const pageButton = document.createElement("button");

        pageButton.type = "button";
        pageButton.textContent = String(i);

        if (i === page) {
            pageButton.classList.add("active-page");
        }

        pageButton.addEventListener("click", () => {
            loadStudents(i);
        });

        container.appendChild(pageButton);
    }

    const nextButton = document.createElement("button");

    nextButton.type = "button";
    nextButton.textContent = "Next";
    nextButton.disabled = page >= totalPages;

    nextButton.addEventListener("click", () => {
        loadStudents(page + 1);
    });

    container.appendChild(nextButton);
}

// ============================================================
// SORTING
// ============================================================

function setupSortableHeaders() {
    const headers = document.querySelectorAll(
        "#studentTable th[data-sort]"
    );

    headers.forEach((header) => {
        header.addEventListener("click", () => {
            const field = header.dataset.sort;

            if (currentSortField === field) {
                currentSortOrder =
                    currentSortOrder === "asc"
                        ? "desc"
                        : "asc";
            } else {
                currentSortField = field;
                currentSortOrder = "asc";
            }

            loadStudents(1);
        });
    });
}

function updateSortIndicators() {
    const headers = document.querySelectorAll(
        "#studentTable th[data-sort]"
    );

    headers.forEach((header) => {
        const field = header.dataset.sort;

        if (!header.dataset.label) {
            header.dataset.label = header.textContent.trim();
        }

        const baseText = header.dataset.label;

        if (field === currentSortField) {
            header.textContent =
                `${baseText} ${
                    currentSortOrder === "asc" ? "▲" : "▼"
                }`;
        } else {
            header.textContent = baseText;
        }
    });
}

// ============================================================
// EDIT STUDENT
// ============================================================

async function editStudent(id) {
    try {
        const response = await fetch(
            `${API_URL}/${encodeURIComponent(id)}`
        );

        const student = await getResponseData(response);

        if (!response.ok) {
            showMessage(
                student.message || "Student not found."
            );
            return;
        }

        document.getElementById("editTitle").style.display =
            "block";

        editStudentForm.style.display = "block";

        document.getElementById("editId").value =
            student._id;

        document.getElementById("editStudentId").value =
            student.studentId;

        document.getElementById("editName").value =
            student.name;

        document.getElementById("editAge").value =
            student.age;

        document.querySelectorAll(
            'input[name="editGender"]'
        ).forEach((radio) => {
            radio.checked =
                radio.value === student.gender;
        });

        document.getElementById("editClassName").value =
            student.className;

        // IMPORTANT:
        // Section is read directly from student.section.
        // This fixes the previous section-update mismatch.
        document.getElementById("editSection").value =
            String(student.section || "").toUpperCase();

        document.getElementById("editEmail").value =
            student.email;

        document.getElementById("editPhone").value =
            student.phone;

        document.getElementById("editAddress").value =
            student.address;

        document.getElementById("editTitle").scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    } catch (error) {
        console.error("Error loading student:", error);

        showMessage(
            "Error loading student information."
        );
    }
}

// ============================================================
// UPDATE STUDENT
// ============================================================

editStudentForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!editStudentForm.checkValidity()) {
        editStudentForm.reportValidity();
        return;
    }

    const selectedGender =
        getSelectedGender("editGender");

    if (!selectedGender) {
        showMessage("Please select a gender.");
        return;
    }

    const id =
        document.getElementById("editId").value;

    if (!id) {
        showMessage("Student record ID is missing.");
        return;
    }

    const updatedStudent = {
        studentId:
            document.getElementById("editStudentId")
                .value.trim(),

        name:
            document.getElementById("editName")
                .value.trim(),

        age:
            Number(
                document.getElementById("editAge").value
            ),

        gender:
            selectedGender.value,

        className:
            document.getElementById("editClassName").value,

        // IMPORTANT:
        // This is the exact field expected by the backend.
        section:
            document.getElementById("editSection").value,

        email:
            document.getElementById("editEmail")
                .value.trim(),

        phone:
            document.getElementById("editPhone")
                .value.trim(),

        address:
            document.getElementById("editAddress")
                .value.trim()
    };

    if (!isValidEmail(updatedStudent.email)) {
        showMessage("Please enter a valid email address.");
        return;
    }

    if (!isValidPhone(updatedStudent.phone)) {
        showMessage(
            "Please enter a valid 10-digit phone number."
        );
        return;
    }

    try {
        const response = await fetch(
            `${API_URL}/${encodeURIComponent(id)}`,
            {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(updatedStudent)
            }
        );

        const data = await getResponseData(response);

        if (!response.ok) {
            showMessage(
                data.message ||
                "Error updating student."
            );
            return;
        }

        showMessage(
            "Student updated successfully!"
        );

        hideEditForm();

        await loadStudents(currentPage);
    } catch (error) {
        console.error(
            "Error updating student:",
            error
        );

        showMessage(
            "Unable to update student."
        );
    }
});

// ============================================================
// HIDE EDIT FORM
// ============================================================

function hideEditForm() {
    editStudentForm.reset();

    editStudentForm.style.display = "none";

    document.getElementById("editTitle").style.display =
        "none";
}

// ============================================================
// CANCEL EDIT
// ============================================================

document.getElementById("cancelEdit")
    .addEventListener("click", hideEditForm);

// ============================================================
// DELETE STUDENT
// ============================================================

async function deleteStudent(id) {
    const confirmDelete = confirm(
        "Are you sure you want to delete this student?"
    );

    if (!confirmDelete) {
        return;
    }

    try {
        const response = await fetch(
            `${API_URL}/${encodeURIComponent(id)}`,
            {
                method: "DELETE"
            }
        );

        const data = await getResponseData(response);

        if (!response.ok) {
            showMessage(
                data.message ||
                "Unable to delete student."
            );
            return;
        }

        showMessage(
            "Student deleted successfully!"
        );

        const nextPage =
            cachedStudents.length === 1 &&
            currentPage > 1
                ? currentPage - 1
                : currentPage;

        await loadStudents(nextPage);
    } catch (error) {
        console.error(
            "Error deleting student:",
            error
        );

        showMessage(
            "Unable to delete student."
        );
    }
}

// ============================================================
// SEARCH
// ============================================================

searchInput.addEventListener("input", () => {
    clearTimeout(searchDebounceTimer);

    searchDebounceTimer = setTimeout(() => {
        currentSearchText =
            searchInput.value.trim();

        loadStudents(1);
    }, 300);
});

// ============================================================
// CLASS FILTER
// ============================================================

classFilter.addEventListener("change", () => {
    currentClassFilter =
        classFilter.value;

    loadStudents(1);
});

// ============================================================
// CLEAR ADD FORM
// ============================================================

document.getElementById("clearForm")
    .addEventListener("click", () => {
        studentForm.reset();
    });

// ============================================================
// DOWNLOAD PDF
// ============================================================

document.getElementById("downloadPdf")
    .addEventListener("click", async () => {
        try {
            const params = new URLSearchParams();

            if (currentClassFilter) {
                params.set(
                    "className",
                    currentClassFilter
                );
            }

            const response = await fetch(
                `${API_URL}?${params.toString()}`
            );

            if (!response.ok) {
                throw new Error(
                    "Unable to fetch student data."
                );
            }

            const data = await response.json();

            const students = Array.isArray(data)
                ? data
                : data.students || [];

            if (students.length === 0) {
                showMessage(
                    "No student data available."
                );
                return;
            }

            if (
                !window.jspdf ||
                !window.jspdf.jsPDF
            ) {
                showMessage(
                    "PDF library is not available."
                );
                return;
            }

            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();

            const primaryColor = [30, 80, 150];
            const secondaryColor = [230, 240, 250];
            const textColor = [40, 40, 40];

            doc.setFillColor(...primaryColor);

            doc.rect(
                0,
                0,
                210,
                30,
                "F"
            );

            doc.setTextColor(
                255,
                255,
                255
            );

            doc.setFont(
                "helvetica",
                "bold"
            );

            doc.setFontSize(18);

            doc.text(
                "SCHOOL STUDENT",
                105,
                12,
                { align: "center" }
            );

            doc.text(
                "MANAGEMENT SYSTEM",
                105,
                21,
                { align: "center" }
            );

            doc.setTextColor(
                ...textColor
            );

            doc.setFont(
                "helvetica",
                "normal"
            );

            doc.setFontSize(10);

            const subtitleText =
                currentClassFilter
                    ? `Student Records Report | Class ${currentClassFilter} | Total Students: ${students.length}`
                    : `Student Records Report | Total Students: ${students.length}`;

            doc.text(
                subtitleText,
                105,
                38,
                { align: "center" }
            );

            let yPosition = 48;

            students.forEach(
                (student, index) => {
                    if (
                        yPosition > 250
                    ) {
                        doc.addPage();
                        yPosition = 20;
                    }

                    doc.setFillColor(
                        ...secondaryColor
                    );

                    doc.roundedRect(
                        15,
                        yPosition,
                        180,
                        9,
                        2,
                        2,
                        "F"
                    );

                    doc.setTextColor(
                        ...primaryColor
                    );

                    doc.setFont(
                        "helvetica",
                        "bold"
                    );

                    doc.setFontSize(12);

                    doc.text(
                        `Student ${index + 1}`,
                        20,
                        yPosition + 6
                    );

                    yPosition += 13;

                    const tableData = [
                        [
                            "Student ID",
                            student.studentId
                        ],
                        [
                            "Name",
                            student.name
                        ],
                        [
                            "Age",
                            student.age
                        ],
                        [
                            "Gender",
                            student.gender
                        ],
                        [
                            "Class",
                            student.className
                        ],
                        [
                            "Section",
                            student.section
                        ],
                        [
                            "Email",
                            student.email
                        ],
                        [
                            "Phone",
                            student.phone
                        ],
                        [
                            "Address",
                            student.address
                        ]
                    ];

                    doc.autoTable({
                        startY: yPosition,
                        body: tableData,
                        theme: "grid",

                        margin: {
                            left: 15,
                            right: 15
                        },

                        styles: {
                            fontSize: 9,
                            cellPadding: 4,
                            textColor,
                            lineColor: [
                                190,
                                200,
                                210
                            ],
                            lineWidth: 0.3
                        },

                        columnStyles: {
                            0: {
                                fontStyle: "bold",
                                textColor:
                                    primaryColor,
                                fillColor:
                                    secondaryColor,
                                cellWidth: 45
                            },

                            1: {
                                cellWidth: 135
                            }
                        },

                        didDrawPage: () => {
                            doc.setFontSize(8);

                            doc.setTextColor(
                                120,
                                120,
                                120
                            );

                            doc.text(
                                "School Student Management System",
                                15,
                                290
                            );

                            doc.text(
                                `Page ${doc.internal.getNumberOfPages()}`,
                                195,
                                290,
                                { align: "right" }
                            );
                        }
                    });

                    yPosition =
                        doc.lastAutoTable.finalY + 12;
                }
            );

            doc.save("student-data.pdf");

            showMessage(
                "Professional PDF downloaded successfully!"
            );
        } catch (error) {
            console.error(
                "PDF download error:",
                error
            );

            showMessage(
                "Unable to download PDF file."
            );
        }
    });

// ============================================================
// DOWNLOAD EXCEL
// ============================================================

document.getElementById("downloadExcel")
    .addEventListener("click", async () => {
        try {
            const params = new URLSearchParams();

            if (currentClassFilter) {
                params.set(
                    "className",
                    currentClassFilter
                );
            }

            const response = await fetch(
                `${API_URL}/download/excel?${params.toString()}`
            );

            if (!response.ok) {
                const data =
                    await getResponseData(response);

                showMessage(
                    data.message ||
                    "Unable to download Excel file."
                );

                return;
            }

            const blob =
                await response.blob();

            const url =
                window.URL.createObjectURL(blob);

            const link =
                document.createElement("a");

            link.href = url;
            link.download = "student-data.xlsx";

            document.body.appendChild(link);
            link.click();
            link.remove();

            window.URL.revokeObjectURL(url);

            showMessage(
                "Professional Excel file downloaded successfully!"
            );
        } catch (error) {
            console.error(
                "Excel download error:",
                error
            );

            showMessage(
                "Unable to download Excel file."
            );
        }
    });

// ============================================================
// DOWNLOAD WORD
// ============================================================

document.getElementById("downloadWord")
    .addEventListener("click", async () => {
        try {
            const params = new URLSearchParams();

            if (currentClassFilter) {
                params.set(
                    "className",
                    currentClassFilter
                );
            }

            const response = await fetch(
                `${API_URL}/download/word?${params.toString()}`
            );

            if (!response.ok) {
                const data =
                    await getResponseData(response);

                showMessage(
                    data.message ||
                    "Unable to download Word file."
                );

                return;
            }

            const blob =
                await response.blob();

            const url =
                window.URL.createObjectURL(blob);

            const link =
                document.createElement("a");

            link.href = url;
            link.download = "student-data.docx";

            document.body.appendChild(link);
            link.click();
            link.remove();

            window.URL.revokeObjectURL(url);

            showMessage(
                "Word file downloaded successfully!"
            );
        } catch (error) {
            console.error(
                "Word download error:",
                error
            );

            showMessage(
                "Unable to download Word file."
            );
        }
    });

// ============================================================
// INITIAL LOAD
// ============================================================

document.addEventListener("DOMContentLoaded", () => {
    setupSortableHeaders();
    loadStudents(1);
});
