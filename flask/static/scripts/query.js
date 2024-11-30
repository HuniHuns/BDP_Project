document.addEventListener("DOMContentLoaded", () => {
    const sections = document.querySelectorAll(".sql-section");
    const buttons = document.querySelectorAll(".sql-functions button");

    async function fetchColumns(table) {
        const response = await fetch(`/get_columns?table=${table}`);
        const data = await response.json();
        return data.columns || [];
    }

    async function updateJoinColumns() {
        const fromTable = document.getElementById("from-table").value;
        const joinTable = document.getElementById("join-table").value;
        const joinColumnSelect = document.getElementById("join-column");

        if (fromTable && joinTable) {
            const response = await fetch(`/get_common_columns?table1=${fromTable}&table2=${joinTable}`);
            const data = await response.json();

            joinColumnSelect.innerHTML = ""; // Clear previous options
            if (data.common_columns && data.common_columns.length > 0) {
                data.common_columns.forEach(column => {
                    const option = document.createElement("option");
                    option.value = column;
                    option.textContent = column;
                    joinColumnSelect.appendChild(option);
                });
            } else {
                const option = document.createElement("option");
                option.value = "";
                option.textContent = "No common columns";
                joinColumnSelect.appendChild(option);
            }
        }
    }

    function generateQuery() {
        const fromTable = document.getElementById("from-table").value;
        const joinTable = document.getElementById("join-table").value;
        const joinColumn = document.getElementById("join-column").value;
        const whereCondition = document.getElementById("where-condition").value;

        let query = `SELECT * FROM ${fromTable}`;
        if (joinTable && joinColumn) {
            query += ` JOIN ${joinTable} ON ${fromTable}.${joinColumn} = ${joinTable}.${joinColumn}`;
        }
        if (whereCondition) {
            query += ` WHERE ${whereCondition}`;
        }

        document.getElementById("query").value = query;
    }

    // 이벤트 리스너
    window.generateQuery = generateQuery;
    document.getElementById("join-table").addEventListener("change", updateJoinColumns);
});
