document.addEventListener("DOMContentLoaded", () => {
    const joinTypeSelect = document.getElementById("join-type");
    const onCheckbox = document.getElementById("on-checkbox");
    const innerJoinSection = document.getElementById("inner-join-section");
    const outerJoinSection = document.getElementById("outer-join-section");
    const naturalJoinSection = document.getElementById("natural-join-section");
    const outerJoinColumnSelect = document.getElementById("outer-join-column");
    const innerJoinColumnSelect = document.getElementById("inner-join-column");
    const queryTextarea = document.getElementById("query");
    const fromTableSelect = document.getElementById("from-table");
    const joinTableSelect = document.getElementById("join-table");
    const outerJoinTypeSelect = document.getElementById("outer-join-type");
    const whereConditionInput = document.getElementById("where-condition");

    // Fetch common columns between tables
    async function fetchCommonColumns() {
        const fromTable = fromTableSelect.value;
        const joinTable = joinTableSelect?.value || ""; // Check for joinTable existence

        if (fromTable && joinTable) {
            const response = await fetch(`/get_common_columns?table1=${fromTable}&table2=${joinTable}`);
            const data = await response.json();
            return data.common_columns || [];
        }
        return [];
    }

    // Update the display of join sections based on selected join type
    function updateJoinSections() {
        const joinType = joinTypeSelect.value;
        innerJoinSection.style.display = joinType === "INNER" ? "block" : "none";
        outerJoinSection.style.display = joinType === "OUTER" ? "block" : "none";
        naturalJoinSection.style.display = joinType === "NATURAL" ? "block" : "none";
    }

    // Populate common columns dynamically
    async function updateCommonColumns(selectElement) {
        const commonColumns = await fetchCommonColumns();
        selectElement.innerHTML = ""; // Clear options
        if (commonColumns.length > 0) {
            commonColumns.forEach(column => {
                const option = document.createElement("option");
                option.value = column;
                option.textContent = column;
                selectElement.appendChild(option);
            });
        } else {
            const option = document.createElement("option");
            option.value = "";
            option.textContent = "No common columns";
            selectElement.appendChild(option);
        }
    }

    // Generate SQL query based on user input
    function generateQuery() {
        const fromTable = fromTableSelect.value.trim();
        const joinTable = joinTableSelect?.value.trim() || ""; // Check for joinTable existence
        const joinType = joinTypeSelect.value;
        const whereCondition = whereConditionInput?.value.trim() || "";

        let query = `SELECT * FROM ${fromTable}`;
        if (joinTable) {
            if (joinType === "INNER") {
                if (onCheckbox.checked) {
                    const innerJoinColumn = innerJoinColumnSelect.value.trim();
                    if (innerJoinColumn) {
                        query += ` JOIN ${joinTable} ON ${fromTable}.${innerJoinColumn} = ${joinTable}.${innerJoinColumn}`;
                    }
                } else {
                    query += ` JOIN ${joinTable}`; // No ON condition for INNER JOIN
                }
            } else if (joinType === "OUTER") {
                const outerJoinType = outerJoinTypeSelect.value;
                const outerJoinColumn = outerJoinColumnSelect.value.trim();
                if (outerJoinType && outerJoinColumn) {
                    query += ` ${outerJoinType.toUpperCase()} OUTER JOIN ${joinTable} ON ${fromTable}.${outerJoinColumn} = ${joinTable}.${outerJoinColumn}`;
                }
            } else if (joinType === "NATURAL") {
                query += ` NATURAL JOIN ${joinTable}`;
            }
        }
        if (whereCondition) {
            query += ` WHERE ${whereCondition}`;
        }

        // Handle edge cases where query is invalid
        if (!fromTable) {
            query = "Error: FROM table is required.";
        }

        queryTextarea.value = query;
    }

    // Add event listeners
    joinTypeSelect.addEventListener("change", () => {
        updateJoinSections();
        if (outerJoinColumnSelect) updateCommonColumns(outerJoinColumnSelect); // Dynamically update common columns
    });

    if (onCheckbox) {
        onCheckbox.addEventListener("change", () => {
            document.getElementById("on-condition").style.display = onCheckbox.checked ? "block" : "none";
        });
    }

    window.generateQuery = generateQuery; // Expose generateQuery to global scope
});
