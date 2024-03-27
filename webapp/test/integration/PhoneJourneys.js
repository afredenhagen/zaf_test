/*global QUnit*/

jQuery.sap.require("sap.ui.qunit.qunit-css");
jQuery.sap.require("sap.ui.thirdparty.qunit");
jQuery.sap.require("sap.ui.qunit.qunit-junit");
QUnit.config.autostart = false;

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
		"com/mindsquare/gdmvt/receipt/ushio/test/integration/NavigationJourneyPhone",
		"com/mindsquare/gdmvt/receipt/ushio/test/integration/NotFoundJourneyPhone",
		"com/mindsquare/gdmvt/receipt/ushio/test/integration/BusyJourneyPhone"
	], function () {
		QUnit.start();
	});
});