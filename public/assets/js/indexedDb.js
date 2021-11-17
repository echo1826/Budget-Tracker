let db;
let budgetVersion;

const request = indexedDB.open('BudgetDB', budgetVersion || 21);

request.onupgradeneeded = function(event) {
    const {oldVersion} = event;
    const newVersion = event.newVersion || db.version;

    db = event.target.result;

    if(db.objectStoreNames.length === 0) {
        db.createObjectStore("BudgetStore", {autoIncrement: true});
    }
};

request.onerror = function(event) {
    console.log("request error", event.target.errorCode);
};

function checkDatabase() {
    let transaction = db.transaction(["BudgetStore"], "readwrite");
    const store = transaction.objectStore("BudgetStore");
    const allFetch = store.getAll();

    allFetch.onsuccess = async function () {
        if(allFetch.result.length > 0) {
            const response = fetch('/api/transaction/bulk', {
                method: 'POST',
                body: JSON.stringify(allFetch.result),
                headers: {
                    Accept: "application/json, text/plain, */*", 
                    "Content-Type": "application/json"
                }
            });
            // const res = await response.json();
            // console.log(response);
            if(response.length !== 0) {
                transaction = db.transaction(["BudgetStore"], "readwrite");
                const currentStore = transaction.objectStore("BudgetStore");

                currentStore.clear();
                console.log("clearing store");
            }
        }
    };
}

request.onsuccess = function(event) {
    db = event.target.result;
    if(navigator.onLine) {
        checkDatabase();
    }
}

function saveRecord(record) {
    const transaction = db.transaction(["BudgetStore"], "readwrite");
    const store = transaction.objectStore("BudgetStore");

    store.add(record);
}

window.addEventListener("online", checkDatabase);