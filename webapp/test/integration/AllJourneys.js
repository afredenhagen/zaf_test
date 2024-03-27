/*global QUnit*/

jQuery.sap.require("sap.ui.qunit.qunit-css");
jQuery.sap.require("sap.ui.thirdparty.qunit");
jQuery.sap.require("sap.ui.qunit.qunit-junit");
QUnit.config.autostart = false;

// We cannot provide stable mock data out of the template.
// If you introduce mock data, by adding .json files in your webapp/localService/mockdata folder you have to provide the following minimum data:
// * At least 3 OrderheaderSet in the list
// * All 3 OrderheaderSet have at least one navHeaderItem

sap.ui.require([
	"sap/ui/test/Opa5",
	"com/mindsquare/gdmvt/receipt/ushio/test/integration/pages/Common",
	"sap/ui/test/opaQunit",
	"com/mindsquare/gdmvt/receipt/ushio/test/integration/pages/App",
	"com/mindsquare/gdmvt/receipt/ushio/test/integration/pages/Browser",
	"com/mindsquare/gdmvt/receipt/ushio/test/integration/pages/Master",
	"com/mindsquare/gdmvt/receipt/ushio/test/integration/pages/Detail",
	"com/mindsquare/gdmvt/receipt/ushio/test/integration/pages/NotFound"
], function (Opa5, Common) {
	"use strict";
	Opa5.extendConfig({
		arrangements: new Common(),
		viewNamespace: "com.mindsquare.gdmvt.receipt.ushio.view."
	});

	sap.ui.require([
		"com/mindsquare/gdmvt/receipt/ushio/test/integration/MasterJourney",
		"com/mindsquare/gdmvt/receipt/ushio/test/integration/NavigationJourney",
		"com/mindsquare/gdmvt/receipt/ushio/test/integration/NotFoundJourney",
		"com/mindsquare/gdmvt/receipt/ushio/test/integration/BusyJourney"
	], function () {
		QUnit.start();
	});
});