
startBuild();


function addButton() {                                       // Динамика кнопки, таблицы, поля drag&drop
    var btnStatus = true;

    var btnAdd = document.getElementById("btnAdd");
    var table = document.getElementById("tbl");
    var certInfo = document.getElementById("cert-info");

    btnAdd.onclick = function () {
        if (btnStatus) {
            table.removeEventListener("click", tblEvent);
            table.classList.add("cursor");
            certInfo.classList.remove("viewDetail");
            certInfo.classList.add("drag-drop");
            certInfo.textContent = "Перетащите сертификат в это поле";
            btnAdd.textContent = "Отменить";
            btnStatus = false;
            deselectAll();
            dragDrop();
        }
        else {
            table.addEventListener("click", tblEvent);
            table.classList.remove("cursor");
            certInfo.classList.remove("drag-drop");
            certInfo.innerHTML = "Выберите сертификат для просмотра<br>информации";
            btnAdd.textContent = "Добавить";
            btnStatus = true;
            dragDrop.remEventFunc();
        };
    };

    var tblEvent = function (event) {
        var target = event.target;
        if (target.tagName != "TD") return;
        selectFunc(target);
    };

    table.addEventListener("click", tblEvent);

    function deselectAll() {
        var collectionElem = table.querySelectorAll(".selected");
        for (var i = 0; i < collectionElem.length; i++) {
            collectionElem[i].classList.remove("selected");
            collectionElem[i].children[0].classList.remove("glyphicon", "glyphicon-triangle-right");
        };
    };

    function selectFunc(elem) {
        deselectAll();
        elem.classList.add("selected");
        elem.querySelector("span").classList.add("glyphicon", "glyphicon-triangle-right");
        var text = elem.textContent;
        viewDetailCert(window.localStorage[text]);
    };

    function viewDetailCert(key) {
        var tempObj = JSON.parse(key);
        certInfo.innerHTML = "Common name: " + tempObj["Common name"] + "</br>" + "Issuer CN: " + tempObj["Issuer CN"] + "</br>"
            + "Valid From: " + tempObj["Valid From"] + "</br>" + "Valid Till: " + tempObj["Valid Till"];
        certInfo.classList.add("viewDetail");
    };
};


function dragDrop() {                                             // Получние файла, преобразование в JSON, запись в localStorage

    function CertItem(commonName, issUer, dateStart, dateEnd) {
        this["Common name"] = commonName;
        this["Issuer CN"] = issUer;
        this["Valid From"] = dateStart;
        this["Valid Till"] = dateEnd;
    };

    var dropZone = document.getElementById("cert-info");

    var addDragover = function (e) {
        e.preventDefault();
    };

    var addDrop = function (e) {
        e.preventDefault();
        var files = e.dataTransfer.files;
        for (var i = 0; i < files.length; i++) {
            var currentFile = files[i];

            var reader = new FileReader();

            reader.onload = (function () {
                return function (event) {
                    var content = event.target.result;
                    var asnDecoded = ASN1.decode(content);

                    var comName = asnDecoded.sub[0].sub[5].sub;   // Область с Common name подписчика 
                    var issName = asnDecoded.sub[0].sub[3].sub;   // Область с Common name центра
                    var dateStart = asnDecoded.sub[0].sub[4].sub[0].content().slice(0, 10);     // Дата
                    var dateEnd = asnDecoded.sub[0].sub[4].sub[1].content().slice(0, 10);       // Дата

                    var issUer = getCommonName(issName);
                    var commonName = getCommonName(comName);

                    if (commonName in window.localStorage) { alert("Сертификат с таким именем уже добавлен!"); return; }

                    var cert = new CertItem(commonName, issUer, dateStart, dateEnd);

                    try {
                        window.localStorage.setItem(commonName, JSON.stringify(cert));
                    } catch (e) {
                        if (e == QUOTA_EXCEEDED_ERR) {
                            alert('Превышен лимит памяти 5Mb');
                        }
                    }
                    addTrToTable(parserLocStor(commonName));
                };
            })(currentFile);

            reader.readAsBinaryString(currentFile);
        };
    };

    dropZone.addEventListener("dragover", addDragover, false);
    dropZone.addEventListener("drop", addDrop, false);

    dragDrop.remEventFunc = function removeEv() {
        dropZone.removeEventListener("dragover", addDragover);
        dropZone.removeEventListener("drop", addDrop);
    };
};

function getCommonName(arr) {                                  // Получение имени подписчика
    for (var i = 0; i < arr.length; i++) {
        if (arr[i].sub[0].sub[0].content() == "2.5.4.3") {
            return arr[i].sub[0].sub[1].content();
        };
    };
};


function parserLocStor(json) {
    return JSON.parse(window.localStorage.getItem(json));
};

function addTrToTable(certName) {                               //Создание и добавление строк таблицы добавляемых сертификатов
    var tr = document.createElement("tr");
    var td = document.createElement("td");
    var span = document.createElement("span");
    span.classList.add("spanIcon");
    td.innerHTML = certName["Common name"];
    document.getElementById("tbl").classList.add("tableGener");
    document.getElementById("tbl").appendChild(tr).appendChild(td).appendChild(span);
};

function startBuild() {                                         //Стартовый вывод таблицы при наличии сохраненных сертификатов
    if (window.localStorage.length != 0) {
        var objWLS = window.localStorage;
        for (key in objWLS) {
            try {
                var parseTemp = JSON.parse(objWLS.getItem(key));
                if ("Common name" in parseTemp) {
                    addTrToTable(parseTemp);
                }
            } catch (e) {
                console.log("Invalid data format: " + "'" + objWLS.getItem(key) + "'" + " - " + e);
                continue;
            };
        };
    };
    addButton();
};