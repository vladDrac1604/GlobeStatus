function transformDate(date) {
    let year = date.getFullYear();
    let month = String(date.getMonth() + 1);
    let day = String(date.getDate());
    if(month.length == 1) {
        month = "0" + month;
    }
    if(day.length == 1) {
        day = "0" + day;
    }
    let finalDate = year + "-" + month + "-" + day;
    return finalDate;
}

module.exports.transformDate = transformDate;