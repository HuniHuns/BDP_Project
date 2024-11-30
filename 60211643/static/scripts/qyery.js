async function fetchColumns(table) {
    const response = await fetch(`/get_columns?table=${table}`);
    const data = await response.json();
    return data.columns || [];
}
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

    const selectColumnsContainer = document.getElementById("select-columns-container");
    const selectAllCheckbox = document.getElementById("select-all-columns");
    innerJoinSection.style.display = "none";
    outerJoinSection.style.display = "none";
    naturalJoinSection.style.display = "none";

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

    async function updateSelectColumns() {
        const fromTable = fromTableSelect.value;
        const columns = await fetchColumns(fromTable);

        selectColumnsContainer.innerHTML = "";
        if (selectAllCheckbox) {
            selectAllCheckbox.checked = false;
        }

        const allOption = document.createElement("input");
        allOption.type = "checkbox";
        allOption.id = "select-all-columns";
        allOption.value = "*";
        allOption.name = "select_columns";
        selectColumnsContainer.appendChild(allOption);

        const allLabel = document.createElement("label");
        allLabel.setAttribute("for", "select-all-columns");
        allLabel.textContent = "All";
        selectColumnsContainer.appendChild(allLabel);

        columns.forEach(column => {
            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.value = column;
            checkbox.name = "select_columns";
            const label = document.createElement("label");
            label.textContent = column;
            selectColumnsContainer.appendChild(checkbox);
            selectColumnsContainer.appendChild(label);
        });
        selectAllCheckbox.addEventListener("change", () => {
            const isChecked = selectAllCheckbox.checked;
            const columnCheckboxes = selectColumnsContainer.querySelectorAll("input[type='checkbox']:not(#select-all-columns)");
            columnCheckboxes.forEach(checkbox => {
                checkbox.checked = isChecked;
            });
        });

        const columnCheckboxes = selectColumnsContainer.querySelectorAll("input[type='checkbox']:not(#select-all-columns)");
        columnCheckboxes.forEach(checkbox => {
            checkbox.addEventListener("change", () => {
                const allChecked = Array.from(columnCheckboxes).every(cb => cb.checked);
                selectAllCheckbox.checked = allChecked;
            });
        });
    }

    function updateJoinSections() {
        const joinType = joinTypeSelect.value;
        innerJoinSection.style.display = joinType === "INNER" ? "block" : "none";
        outerJoinSection.style.display = joinType === "OUTER" ? "block" : "none";
        naturalJoinSection.style.display = joinType === "NATURAL" ? "block" : "none";
    }

    async function updateCommonColumns(selectElement) {
        const commonColumns = await fetchCommonColumns();
        selectElement.innerHTML = "";
        console.log("update common columns")

        if (commonColumns.length > 0) {
            commonColumns.forEach(column => {
                const option = document.createElement("option");
                option.value = column;
                option.textContent = column;
                console.log(column)
                selectElement.appendChild(option);
            });
        } else {
            const option = document.createElement("option");
            option.value = "";
            option.textContent = "No common columns";
            selectElement.appendChild(option);
        }
    }
    function generateQuery() {
        const fromTable = fromTableSelect.value.trim();
        const joinTable = joinTableSelect.value.trim();
        const joinType = joinTypeSelect.value;
        const whereCondition = document.getElementById("where-condition")?.value.trim() || "";

        let query = `SELECT `;
        const selectedColumns = Array.from(selectColumnsContainer.querySelectorAll("input[type='checkbox']:checked"))
            .map(input => input.value);
        if (selectedColumns.length === 0) {
            query += "*";
        } else if (selectedColumns.includes("*")) {
            query += "*";
        } else {
            query += selectedColumns.join(", ");
        }
        query += ` FROM ${fromTable}`;

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
        document.getElementById("query").value = query;
        document.getElementById("execute-btn").style.display = "inline-block";

        updateSelectColumns();
    }

    fromTableSelect.addEventListener("change", function () {
        updateSelectColumns();
    });

    joinTableSelect.addEventListener("change", function () {
        updateSelectColumns();
    });

    joinTableSelect.addEventListener("change", () => {
        if (joinTableSelect.value) {
            joinTypeSelect.value = "INNER";
            innerJoinSection.style.display = "block";
            updateJoinSections();
        } else {
            innerJoinSection.style.display = "none";
            outerJoinSection.style.display = "none";
            naturalJoinSection.style.display = "none";
        }
    });
    joinTypeSelect.addEventListener("change", updateJoinSections);
    if (joinTableSelect.value) {
        joinTypeSelect.value = "INNER";
        innerJoinSection.style.display = "block";
        updateJoinSections();
    }
    joinTableSelect.addEventListener("change", () => {
        updateCommonColumns(innerJoinColumnSelect);
        updateCommonColumns(outerJoinColumnSelect);
    });

    onCheckbox.addEventListener("change", () => {
        document.getElementById("on-condition").style.display = onCheckbox.checked ? "block" : "none";
    });
    window.generateQuery = generateQuery;
});
