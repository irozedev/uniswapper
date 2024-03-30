<th>Статус обработки <span class="sort-icon">▼</span></th>
.sort-icon {
    cursor: pointer;
    user-select: none;
}
document.addEventListener('DOMContentLoaded', function() {
    var table = document.getElementById('myTable'); // Предполагаем, что ваша таблица имеет id="myTable"
    var headers = table.getElementsByTagName('th');
    var lastHeader = headers[headers.length - 1];
    var icon = lastHeader.querySelector('.sort-icon');

    lastHeader.addEventListener('click', function() {
        sortTable(table, headers.length - 1);
        toggleSortIcon(icon);
    });
});

var isAscending = false; // По умолчанию сортировка не активирована

function sortTable(table, col) {
    var rows, switching, i, x, y, shouldSwitch;

    switching = true;
    while (switching) {
        switching = false;
        rows = table.getElementsByTagName("tr");
        
        // Проход по всем строкам, кроме первой (заголовок)
        for (i = 1; i < (rows.length - 1); i++) {
            shouldSwitch = false;
            
            // Получение текста двух соседних ячеек
            x = rows[i].getElementsByTagName("td")[col];
            y = rows[i + 1].getElementsByTagName("td")[col];
            
            if ((isAscending && x.innerHTML.toLowerCase() > y.innerHTML.toLowerCase()) ||
                (!isAscending && x.innerHTML.toLowerCase() < y.innerHTML.toLowerCase())) {
                shouldSwitch = true;
                break;
            }
        }
        if (shouldSwitch) {
            rows[i].parentNode.insertBefore(rows[i + 1], rows[i]);
            switching = true;
        }
    }
    isAscending = !isAscending;
}

function toggleSortIcon(icon) {
    icon.textContent = isAscending ? '▲' : '▼';
}
