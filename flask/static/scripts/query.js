document.addEventListener("DOMContentLoaded", () => {
    const sections = document.querySelectorAll(".sql-section");
    const buttons = document.querySelectorAll(".sql-functions button");

    // 섹션 전환
    function showSection(sectionId) {
        sections.forEach(section => {
            if (section.id === sectionId) {
                section.classList.add("active");
            } else {
                section.classList.remove("active");
            }
        });

        // 버튼 활성화 상태 변경
        buttons.forEach(button => {
            if (button.id === `${sectionId.split('-')[0]}-btn`) {
                button.classList.add("active");
            } else {
                button.classList.remove("active");
            }
        });
    }

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
        const queryType = document.querySelector(".sql-functions .active").textContent;
        let query = "";

        if (queryType === "SELECT") {
            const fromTable = document.getElementById("from-table").value;
            const joinTable = document.getElementById("join-table").value;
            const joinColumn = document.getElementById("join-column").value;
            const whereCondition = document.getElementById("where-condition").value;

            query = `SELECT * FROM ${fromTable}`;
            if (joinTable && joinColumn) {
                query += ` JOIN ${joinTable} ON ${fromTable}.${joinColumn} = ${joinTable}.${joinColumn}`;
            }
            if (whereCondition) {
                query += ` WHERE ${whereCondition}`;
            }
        } else if (queryType === "DELETE") {
            const deleteTable = document.getElementById("delete-table").value;
            const deleteCondition = document.getElementById("delete-condition").value;

            query = `DELETE FROM ${deleteTable}`;
            if (deleteCondition) {
                query += ` WHERE ${deleteCondition}`;
            }
        } else if (queryType === "UPDATE") {
            const updateTable = document.getElementById("update-table").value;
            const updateSet = document.getElementById("update-set").value;
            const updateCondition = document.getElementById("update-condition").value;

            query = `UPDATE ${updateTable} SET ${updateSet}`;
            if (updateCondition) {
                query += ` WHERE ${updateCondition}`;
            }
        } else if (queryType === "INSERT") {
            const insertTable = document.getElementById("insert-table").value;
            const insertColumns = document.getElementById("insert-columns").value;
            const insertValues = document.getElementById("insert-values").value;

            query = `INSERT INTO ${insertTable} (${insertColumns}) VALUES (${insertValues})`;
        }

        document.getElementById("query").value = query;
    }

    // 초기 상태: SELECT 섹션 활성화
    showSection("select-section");

    // 이벤트 리스너
    window.showSection = showSection;
    window.generateQuery = generateQuery;
    document.getElementById("join-table").addEventListener("change", updateJoinColumns);
});
