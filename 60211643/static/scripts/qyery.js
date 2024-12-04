async function fetchColumns(table) {
    const response = await fetch(`/get_columns?table=${table}`);
    const data = await response.json();
    return data.columns || [];
}
async function processWhereCondition(whereCondition, fromTable, joinTable) {
    const fromTableColumns = await fetchColumns(fromTable);
    const joinTableColumns = joinTable ? await fetchColumns(joinTable) : [];
    const processedCondition = whereCondition.split(/\s+/).map(word => {
        if (fromTableColumns.includes(word)) {
            return joinTable ? `t1.${word}` : word;
        }
        if (joinTableColumns.includes(word)) {
            return `t2.${word}`;
        }
        return word;
    }).join(" ");
    return processedCondition;
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
        const joinTable = joinTableSelect.value;

        const fromColumns = fromTable ? await fetchColumns(fromTable) : [];
        const joinColumns = joinTable ? await fetchColumns(joinTable) : [];

        const uniqueJoinColumns = joinColumns.filter(column => !fromColumns.includes(column));

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

        fromColumns.forEach(column => {
            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.value = joinTable ? `t1.${column}` : column;
            checkbox.name = "select_columns";
            const label = document.createElement("label");
            label.textContent = column;
            selectColumnsContainer.appendChild(checkbox);
            selectColumnsContainer.appendChild(label);
        });

        uniqueJoinColumns.forEach(column => {
            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.value = `t2.${column}`;
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
    async function generateQuery() {
        const fromTable = fromTableSelect.value.trim();
        const joinTable = joinTableSelect.value.trim();
        const joinType = joinTypeSelect.value;
        const whereCondition = document.getElementById("where-condition")?.value.trim() || "";

        const fromAlias = joinTable ? "t1" : "";
        const joinAlias = "t2";

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
        if (fromAlias) {
            query += ` AS ${fromAlias}`;
        }
        if (joinTable) {
            if (joinType === "INNER") {
                if (onCheckbox.checked) {
                    const innerJoinColumn = innerJoinColumnSelect.value.trim();
                    if (innerJoinColumn) {
                        query += ` JOIN ${joinTable} AS ${joinAlias} ON ${fromAlias}.${innerJoinColumn} = ${joinAlias}.${innerJoinColumn}`;
                    }
                } else {
                    query += ` JOIN ${joinTable} AS ${joinAlias}`;
                }
            } else if (joinType === "OUTER") {
                const outerJoinType = outerJoinTypeSelect.value;
                const outerJoinColumn = outerJoinColumnSelect.value.trim();
                if (outerJoinType && outerJoinColumn) {
                    query += ` ${outerJoinType.toUpperCase()} OUTER JOIN ${joinTable} AS ${joinAlias} ON ${fromAlias}.${outerJoinColumn} = ${joinAlias}.${outerJoinColumn}`;
                }
            } else if (joinType === "NATURAL") {
                query += ` NATURAL JOIN ${joinTable}`;
            }
        }
        if (whereCondition) {
            const processedCondition = await processWhereCondition(whereCondition, fromTable, joinTable);
            query += ` WHERE ${processedCondition}`;
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
