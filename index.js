var table

function onPageReady() {
    var startingLicense = "A3.0";
    currentLicenses = ["", "", ""]
    updateLicenseCPI(currentLicenses);

    table = new DataTable('#datatable', {
        fixedHeader: true,
        columns: [
            {
                title: 'Series',
                data: 'series'
            },
            {
                title: 'Track',
                data: 'track'
            },
            {
                title: 'Car Class',
                data: 'car_class',
                className: "incident",
                render: function (data, type, row) {
                    console.log(row)
                    return "<div>" + data + carTooltip(row.car_names) + "</div>";
                }
            },
            {
                title: 'Category',
                data: 'category',
                render: function (data) {
                    var cat = "Sports Car";
                    switch (data) {
                        case "formula_car":
                            cat = "Formula";
                            break;
                        case "oval":
                            cat = "Oval";
                            break;
                        case "dirt_oval": //todo: dirt oval
                            cat = "Dirt Oval";
                            break;
                        case "dirt_road": // todo: dirt road
                            cat = "Dirt Road";
                            break;

                    }
                    return cat;
                }
            },
            {
                title: 'License',
                data: 'license',
                render: function (data) {
                    return '<div class="license-box class-' + data.toLowerCase() + '">' + data + '</div>';
                }
            },
            {
                title: 'Week',
                data: 'week'
            },
            {
                title: 'Laps',
                data: 'laps'
            },
            {
                title: 'CPL',
                data: 'corners_per_lap'
            },
            {
                title: 'Corners',
                data: 'corners'
            },
            {
                title: 'CPM',
                data: ['expected_time'],
                type: "num",
                render: function (data, type, row) {
                    return data == 0 ? "-" : Number((row['corners'] / (data / 60)).toFixed(2));
                }
            },
            {
                name: "license0",
                data: "license0",
                type: "num",
                className: "incident",
                render: function (data) {
                    return "<div>" + data + "x" + incidentTooltip(data, currentLicenses[0]) + "</div>";
                }
            },
            {
                name: "license1",
                data: 'license1',
                type: "num",
                className: "incident",
                render: function (data) {
                    return "<div>" + data + "x" + incidentTooltip(data, currentLicenses[1]) + "</div>";
                }

            },
            {
                name: "license2",
                data: 'license2',
                type: "num",
                className: "incident",
                render: function (data) {
                    return "<div>" + data + "x" + incidentTooltip(data, currentLicenses[2]) + "</div>";
                }
            }
        ],
        data: series,
        order: [[4, 'asc']],
        paging: false,
        language: {
            info: '_TOTAL_ of _MAX_',
            infoFiltered: '',
            infoEmpty: '',
            searchPanes: { collapse: "Filter" }
        },
        ordering: {
            indicators: false
        },
        columnControl: ['orderStatus'],
        layout: {
            topStart: {
                div: {
                    html: 'Current License<input id="license-input" style="margin-left: 6px"><button class="dt-button" type="button" onclick="setLicense(event);" style="margin-left: 6px">Set</button><span></span><input id="classFilterEnabled" type="checkbox" onChange="updateClassFilter(checked)">Filter by License</input>',
                    className: "dt-buttons"
                }
            },
            topEnd: {
                buttons: [
                    {
                        extend: 'searchPanes',
                        config: {
                            controls: false,
                            collapse: false,
                            cascadePanes: true,
                            dtOpts: {
                                searching: false,
                                select: {
                                    style: 'multi'
                                }
                            }
                        }
                    }]
            }
        },
        columnDefs: [
            {
                searchPanes: {
                    show: true
                },
                targets: [0, 1, 2, 3, 4]
            },
            {
                searchPanes: {
                    show: false
                },
                targets: ['_all']
            }
        ]
    });
    updateLicenseColumns(startingLicense);
};

// Run the above function when the page is loaded & ready
document.addEventListener('DOMContentLoaded', onPageReady, false);


function setLicense(e) {
    var input = document.getElementById("license-input").value
    if (!/^[ABCDR][01234]\.\d{1,2}$/i.test(input)) {
        console.log("error")
    } else {
        updateLicenseColumns(input);
        updateClassFilter(document.getElementById("classFilterEnabled").checked);
    }
};

function updateLicenseColumns(input) {


    classLetter = input.substr(0, 1)
    max = "4.0"
    switch (classLetter) {
        case "A":
            max = "4.99"
            break;
        case "R":
            max = "3.0"
            break;
    }
    document.getElementById("license-input").value = input
    licenses = [classLetter + " 2.0", classLetter + " " + input.slice(1), classLetter + " " + max]
    licenses.sort();
    updateLicenseCPI(licenses);
    // iterate over each column, and change their title
    for (license in licenses) {
        table.column("license" + license + ":name").title('<div class="license-box class-' + classLetter.toLowerCase() + '">' + licenses[license] + '</div>')
    }

    // delete rows and add them back with the updated data array
    table.rows("*").invalidate(series)
}

function calculateLicenseCPI(licenseString) {
    licenseMap = {
        "R": 0,
        "D": 1,
        "C": 2,
        "B": 3,
        "A": 4,
    }
    licenseLevel = Number(licenseMap[licenseString.substr(0, 1)]) * 4 + Number(licenseString.substr(2, 1))
    licenseValue = Number(licenseString.substr(2,))

    licenseClass = Math.ceil(licenseLevel / 4)
    licenseSubClass = ((licenseLevel - 1) % 4) + 1

    wcLicense = Math.floor(licenseLevel / 25)

    rookieAdjustmentCalcZero = Math.floor(1 / (Math.pow(licenseLevel - 2, 2) + 1)) * 0.3;
    rookieAdjustmentCalcOne = Math.floor(1 / licenseLevel) * 0.4

    calcZero = Math.round(5 * Math.pow(1.46, (licenseSubClass + licenseClass - wcLicense - 2)) + rookieAdjustmentCalcZero, 0)
    calcOne = Math.round(9.6 * Math.pow(1.46, (licenseSubClass + licenseClass - wcLicense - 2)) - rookieAdjustmentCalcOne, 0)

    modifier = 1 / Math.log(calcOne / calcZero);
    cpi = Math.ceil(Math.exp((licenseValue - licenseSubClass) / modifier) * calcZero);
    /*
    sr = licenseSubClass + modifier * Math.log(cpi / calcZero);

    console.log("License String:        " + licenseString)
    console.log("License Level:         " + licenseLevel)
    console.log("License Class:         " + licenseClass)
    console.log("License Sub Class:     " + licenseSubClass)
    console.log("RCalc Zero:             " + rookieAdjustmentCalcZero)
    console.log("RCalc One:              " + rookieAdjustmentCalcOne)
    console.log("Calc Zero:             " + calcZero)
    console.log("Calc One:              " + calcOne)
    console.log("modifier:              " + modifier)
    console.log("CPI:                   " + cpi)
    console.log("SR:                    " + sr)
    */
    return cpi;

}

function updateLicenseCPI(licenseArray) {
    currentLicenses = licenseArray;
    for (let item in series) {
        for (let license in licenseArray) {
            series[item]['license' + license] = Math.floor(series[item]['corners'] / calculateLicenseCPI(licenseArray[license]));
        }
    }
}

function updateClassFilter(checked) {

    // shouldnt need this, need to find where it initialises, then initialise it manually
    if (table.state().searchPanes === undefined) {
        table.state().searchPanes = { selectionList: [] }
    }

    searchPanesSelections = table.state().searchPanes.selectionList
    searchPanesSelectionsClass = searchPanesSelections.find(x => x.column === table.column('License:title').index())


    if (checked) {
        // detemine the classes to filter
        classLetter = document.getElementById("license-input").value.substr(0, 1)
        licenseMap = {
            "R": 0,
            "D": 1,
            "C": 2,
            "B": 3,
            "A": 4,
        }

        classFilters = Object.keys(licenseMap).splice(0, licenseMap[classLetter] + 1)
        if (searchPanesSelectionsClass == undefined) {
            searchPanesSelections.push({ column: 4, rows: classFilters })
        } else {
            searchPanesSelectionsClass.rows = classFilters
        }

    } else {
        searchPanesSelections.splice(searchPanesSelections.findIndex(x => x.column === table.column('License:title').index()), 1)
    }

    table.searchPanes.rebuildPane(4)
}

function incidentTooltip(incidents, license) {
    return '<div class="incident-tooltip">' + '<h4 style="margin-top:0px;">Average incidents to maintain the specified Safety Rating:</h4>' +
        "You have an allowance of <b><i>" + incidents + "x" + "</i></b> to maintain a Safety Rating of <b><i>" + license/*safetyRating*/ + "</b></i>, any more incidents and you risk losing rating." + "</div>"
}

function carTooltip(cars) {
    carString = ""
    if (cars) {
        for (car in cars) {
            carString += "<p>" + cars[car] + "</p>"
        }
    }

    return '<div class="incident-tooltip">' + '<h4 style="margin-top:0px;">Cars:</h4>' +
        '<span>' + carString + "</span>" + "</div>"
}