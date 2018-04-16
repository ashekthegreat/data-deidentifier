(function () {

    angular.module("deidentifier")
        .factory("HomeFactory", HomeFactory);

    var _ = require("underscore");
    var csv = require("fast-csv");
    var fs = require("fs");
    var firstline = require("firstline")

    var definition = {
        id: "member_id",
        hicn: "hicn_medical_claims_header",
        firstName: "member_first_name_medical_claims_header",
        lastName: "member_last_name_medical_claims_header",
        gender: "member_gender_medical_claims_header",
        address: "member_street_address_medical_claims_header",
        zip: "member_zip_code_medical_claims_header",
        dob: "member_dob_medical_claims_header",
        ssn: "member_ssn_medical_claims_header",
        medicaidMemberId: "medicaid_member_id_medical_claims_header"
    };

    HomeFactory.$inject = ["$q", "DataFactory", "DefinitionFactory"];

    function HomeFactory($q, DataFactory, DefinitionFactory) {
        var factory = {};

        var generatedPairs = [];
        var baseCounter = 0;

        function getReplacePair(row, generatedPairs, sourceFile) {
            // check if such a pair already exists. if yes, return that
            var produced = _.find(generatedPairs, function (pair) {
                return pair.id == row[definition.id];
            });

            if (!produced) {
                // its a new pair. lets create one and push
                baseCounter += 1;
                var gender = "M";
                if (definition.gender && row[definition.gender] && row[definition.gender].toUpperCase().charAt(0) == "F") {
                    gender = "F";
                }

                produced = {
                    id: row[definition.id]
                };
                if (sourceFile.columns.indexOf(definition.hicn) > -1) {
                    produced[definition.hicn] = DataFactory.hicn(baseCounter);
                }
                if (sourceFile.columns.indexOf(definition.lastName) > -1) {
                    produced[definition.lastName] = DataFactory.lastName();
                }
                if (sourceFile.columns.indexOf(definition.firstName) > -1) {
                    produced[definition.firstName] = DataFactory.firstName(gender);
                }
                if (sourceFile.columns.indexOf(definition.zip) > -1) {
                    produced[definition.zip] = DataFactory.zip();
                }
                if (sourceFile.columns.indexOf(definition.dob) > -1) {
                    produced[definition.dob] = DataFactory.dob();
                }
                if (sourceFile.columns.indexOf(definition.address) > -1) {
                    produced[definition.address] = DataFactory.address();
                }
                if (sourceFile.columns.indexOf(definition.ssn) > -1) {
                    produced[definition.ssn] = DataFactory.ssn(baseCounter);
                }
                if (sourceFile.columns.indexOf(definition.medicaidMemberId) > -1) {
                    produced[definition.medicaidMemberId] = DataFactory.medicaidId();
                }

                generatedPairs.push(produced);
            }

            var cloned = angular.copy(produced);
            if (cloned.id) {
                delete cloned.id;
            }
            return cloned;
        }

        function formatData(row, generatedPairs, sourceFile) {
            var replacePair = getReplacePair(row, generatedPairs, sourceFile);
            _.extend(row, replacePair);
            return row;
        }

        factory.parseFirstLine = function (fileName) {

            return firstline(fileName).then(function (line) {
                var qualifier = "";
                var delimiter = ",";

                var allDelimiters = DefinitionFactory.getDelimiters();

                if (line.length) {
                    // check for qualifier
                    var firstChar = line.charAt(0);
                    if (firstChar == "'") {
                        qualifier = "'";
                    } else if (firstChar == '"') {
                        qualifier = '"';
                    }

                    var maxFoundSoFar = 0;
                    _.each(allDelimiters, function (item) {
                        var count = (line.split(item.val).length - 1);
                        console.log("Columns: " + count);
                        console.log(item.val);
                        if (count > maxFoundSoFar) {
                            maxFoundSoFar = count;
                            delimiter = item.val;
                        }
                    })
                }
                return {
                    qualifier: qualifier,
                    delimiter: delimiter
                };
            });
        };

        factory.parse = function (fileName) {

            return $q(function (resolve, reject) {
                var i;
                var count = 0;
                fs.createReadStream(fileName)
                    .on('data', function (chunk) {
                        for (i = 0; i < chunk.length; ++i)
                            if (chunk[i] == 10) count++;
                    })
                    .on('end', function () {
                        console.log(count);
                        resolve({
                            rowCount: count - 1   // excluding header row
                        });
                    })
                    .on('error', function () {
                        console.log("Error occurred parsing file");
                        reject('Could not parse file');
                    });
            });
        };

        factory.parseHeader = function (fileName, options) {

            return $q(function (resolve, reject) {
                var columns = [];
                var fileStream = fs.createReadStream(fileName, 'utf8');
                var csvStream = csv({headers: false, delimiter: options.delimiter});
                fileStream.pipe(csvStream);

                var onData = function (data) {
                    columns = data;
                    csvStream.emit('donereading');
                };
                csvStream.on('data', onData);

                csvStream
                    .on("end", function () {
                        csvStream.emit('donereading');
                    })
                    .on('error', function (error) {
                        console.log("Analyze failed");
                        reject(error);
                    })
                    .on('donereading', function () {
                        fileStream.close();
                        csvStream.removeListener('data', onData);
                        resolve({
                            columns: columns
                        });
                    });
            });
        };

        factory.transform = function (sourceFile, targetName, options) {
            //console.log("Base Counter: " + baseCounter);
            //console.log("Generated: " + generatedPairs.length);

            var count = 0;
            definition = options.definition;

            var deferred = $q.defer();

            csv
                .fromPath(sourceFile.name, {headers: true, delimiter: options.delimiter})
                .transform(function (obj) {
                    count++;
                    deferred.notify({
                        status: "in-progress",
                        count: count
                    });
                    return formatData(obj, generatedPairs, sourceFile);
                })
                .on("end", function () {
                    console.log("Transformed: " + count);
                    deferred.resolve({
                        status: "complete",
                        count: count
                    });
                })
                .on('error', function (error) {
                    console.log("Catch an invalid csv file!!!");
                    deferred.reject(error);
                })
                .pipe(csv.createWriteStream({headers: true, quoteColumns: !!options.textQualifier, delimiter: options.delimiter}))   // , quoteColumns:true
                .pipe(fs.createWriteStream(targetName, {encoding: "utf8"}));

            return deferred.promise;
        };

        return factory;
    }
}());