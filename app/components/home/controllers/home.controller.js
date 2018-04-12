(function () {
    angular.module("deidentifier")
        .controller("HomeController", HomeController);

    const {remote} = require('electron');

    HomeController.$inject = ["$scope", "$timeout", "HomeFactory", "DefinitionFactory"];

    function HomeController($scope, $timeout, HomeFactory, DefinitionFactory) {
        $scope.message = "";
        $scope.data = {};
        $scope.file = {};
        $scope.isParsing = false;
        $scope.isTransforming = false;
        $scope.delimiters = DefinitionFactory.getDelimiters();

        $scope.textQualifiers = DefinitionFactory.getTextQualifiers();
        $scope.dataComponents = DefinitionFactory.getDataComponents();

        /*$scope.dataComponents = {
            hicn: "hicn_medical_claims_header",
            firstName: "member_first_name_medical_claims_header",
            lastName: "member_last_name_medical_claims_header",
            gender: "member_gender_medical_claims_header",
            address: "member_street_address_medical_claims_header",
            zip: "member_zip_code_medical_claims_header",
            dob: "member_dob_medical_claims_header",
            ssn: "member_ssn_medical_claims_header",
            medicaidMemberId: "medicaid_member_id_medical_claims_header"
        };*/

        $scope.options = {
            delimiter: "|",
            textQualifier: '"',
            definition: {}
        };
        $scope.dump = function () {
            console.log($scope.dataComponents);
        };
        $scope.pickFile = function () {
            var {dialog} = remote;

            dialog.showOpenDialog({
                properties: ['openFile'],
                filters: {
                    name: 'Comma sep files',
                    extensions: ['csv', 'txt']
                }
            }, function (files) {
                if (!files) {
                    return;
                }
                console.log(files);
                $scope.isParsing = false;
                $scope.isTransforming = false;
                $scope.file = {
                    name: files[0]
                };
                $scope.$apply();
            })
        };

        $scope.analyze = function () {
            if (!$scope.file.name) {
                return;
            }
            $scope.isParsing = true;
            $scope.isTransforming = false;

            $timeout(function () {
                HomeFactory.parse($scope.file.name).then(function (file) {
                    $scope.file.rowCount = file.rowCount;
                    HomeFactory.parseHeader($scope.file.name, $scope.options).then(function (response) {
                        $scope.file.columns = response.columns;
                        $scope.isParsing = false;
                        //console.log(response.columns);
                    });
                }, function (error) {
                    console.log(error);
                });
            }, 0);
        };

        $scope.clearFile = function () {
            $scope.file = {};
            $scope.isParsing = false;
        };

        $scope.transform = function () {

            // prepare definition model
            $scope.options.definition = {};
            _.each($scope.dataComponents, function (item) {
                if (item.dataField) {
                    $scope.options.definition[item.val] = item.dataField;
                }
            });

            var {dialog} = remote;
            var targetPath = $scope.file.name.replace(/(\.[\w\d_-]+)$/i, '_deidentified$1');

            dialog.showSaveDialog({
                defaultPath: targetPath,
                filters: {
                    name: 'Comma sep files',
                    extensions: ['csv', 'txt']
                }
            }, function (fileName) {
                if (!fileName) {
                    return;
                }
                console.log(fileName);

                $scope.isTransforming = true;
                HomeFactory.transform($scope.file, fileName, $scope.options).then(function (response) {
                    console.log(response);
                    $scope.percent = parseInt((response.count * 100 ) / $scope.file.rowCount, 10);
                    $timeout(function () {
                        alert("De-identification completed successfully for " + response.count + " rows");
                    }, 1200);
                }, function (reason) {
                    $timeout(function () {
                        alert(reason.message);
                    }, 0);
                    $scope.isTransforming = false;
                }, function (update) {
                    $scope.percent = parseInt((update.count * 100 ) / $scope.file.rowCount, 10);
                });
            })

        }

    }
}());