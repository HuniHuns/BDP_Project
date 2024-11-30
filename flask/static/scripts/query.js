document.addEventListener("DOMContentLoaded", () => {
    const joinTypeSelect = document.getElementById("join-type");
    const joinTableSelect = document.getElementById("join-table");
    const onCheckbox = document.getElementById("on-checkbox");
    const innerJoinSection = document.getElementById("inner-join-section");
    const outerJoinSection = document.getElementById("outer-join-section");
    const naturalJoinSection = document.getElementById("natural-join-section");
    const innerJoinColumnSelect = document.getElementById("inner-join-column");
    const outerJoinColumnSelect = document.getElementById("outer-join-column");
    const queryTextarea = document.getElementById("query");
    const fromTableSelect = document.getElementById("from-table");
    const outerJoinTypeSelect = document.getElementById("outer-join-type");

    // Fetch common columns between FROM and JOIN tables
    async function fetchCommonColumns() {
        const fromTable = fromTableSelect.value;
        const joinTable = joinTableSelect.value;

        if (fromTable && joinTable) {
            const response = await fetch(`/get_common_columns?table1=${fromTable}&table2=${joinTable}`);
            const data = await response.json();
            return data.common_columns || [];
        }
        return [];
    }

    // Update join sections visibility
    function updateJoinSections() {
        const joinType = joinTypeSelect.value;
        innerJoinSection.style.display = joinType === "INNER" ? "block" : "none";
        outerJoinSection.style.display = joinType === "OUTER" ? "block" : "none";
        naturalJoinSection.style.display = joinType === "NATURAL" ? "block" : "none";
    }

    // Populate columns dynamically in dropdowns
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

    // Generate the SQL query
    function generateQuery() {
        const fromTable = fromTableSelect.value.trim();
        const joinTable = joinTableSelect.value.trim();
        const joinType = joinTypeSelect.value;
        const whereCondition = document.getElementById("where-condition")?.value.trim() || "";

        let query = `SELECT * FROM ${fromTable}`;
        if (joinTable) {
            if (joinType === "INNER") {
                if (onCheckbox.checked) {
                    const innerJoinColumn = innerJoinColumnSelect.value.trim();
                    if (innerJoinColumn) {
                        query += ` JOIN ${joinTable} ON ${fromTable}.${innerJoinColumn} = ${joinTable}.${innerJoinColumn}`;
                    }
                } else {
                    query += ` JOIN ${joinTable}`;
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

        queryTextarea.value = query;
    }

    // Event listeners
    joinTypeSelect.addEventListener("change", updateJoinSections);
    joinTableSelect.addEventListener("change", () => {
        updateCommonColumns(innerJoinColumnSelect);
        updateCommonColumns(outerJoinColumnSelect);
    });
    onCheckbox.addEventListener("change", () => {
        document.getElementById("on-condition").style.display = onCheckbox.checked ? "block" : "none";
    });

    window.generateQuery = generateQuery;
});
