(function () {

    angular.module("deidentifier")
        .factory("DefinitionFactory", DefinitionFactory);

    var _ = require("underscore");

    DefinitionFactory.$inject = [];

    function DefinitionFactory() {
        var factory = {};

        factory.delimiters = [
            {
                title: "Comma (,)",
                val: ","
            },{
                title: "Tab (\t)",
                val: "\t"
            },{
                title: "Semicolon (;)",
                val: ";"
            },{
                title: "Pipe (|)",
                val: "|"
            },{
                title: "Asterisk (*)",
                val: "*"
            },{
                title: "Tilde (~)",
                val: "~"
            }
        ];

        factory.textQualifiers = [
            {
                title: "None",
                val: ""
            },{
                title: 'Double Quote (")',
                val: '"'
            },{
                title: "Single Quote (')",
                val: "'"
            }
        ];
        factory.dataComponents = [
            {
                title: "Member HICN",
                val: "hicn",
                dataField: "hicn_medical_claims_header"
            },{
                title: "Member First Name",
                val: "firstName",
                dataField: "member_first_name_medical_claims_header"
            },{
                title: "Member Last Name",
                val: "lastName",
                dataField: "member_last_name_medical_claims_header"
            },{
                title: "Member Gender",
                val: "gender",
                dataField: "member_gender_medical_claims_header"
            },{
                title: "Member Address 1",
                val: "address",
                dataField: "member_street_address_medical_claims_header"
            },{
                title: "Member Zip",
                val: "zip",
                dataField: "member_zip_code_medical_claims_header"
            },{
                title: "Member DOB",
                val: "dob",
                dataField: "member_dob_medical_claims_header"
            },{
                title: "Member SSN",
                val: "ssn",
                dataField: "member_ssn_medical_claims_header"
            },{
                title: "Member Medicaid ID",
                val: "medicaidMemberId",
                dataField: "medicaid_member_id_medical_claims_header"
            }
        ];

        factory.getDelimiters = function () {
            var cloned = {};
            _.extend(cloned, factory.delimiters);

            return cloned;
        };

        factory.getTextQualifiers = function () {
            var cloned = {};
            _.extend(cloned, factory.textQualifiers);

            return cloned;
        };

        factory.getDataComponents = function () {
            var cloned = {};
            _.extend(cloned, factory.dataComponents);

            return cloned;
        };

        return factory;

    }
}());