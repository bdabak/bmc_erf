/*global QUnit*/

jQuery.sap.require("sap.ui.qunit.qunit-css");
jQuery.sap.require("sap.ui.thirdparty.qunit");
jQuery.sap.require("sap.ui.qunit.qunit-junit");
QUnit.config.autostart = false;

sap.ui.require([
	"sap/ui/test/Opa5",
	"com/bmc/hcm/erf/test/integration/pages/Common",
	"sap/ui/test/opaQunit",
	"com/bmc/hcm/erf/test/integration/pages/Worklist",
	"com/bmc/hcm/erf/test/integration/pages/Object",
	"com/bmc/hcm/erf/test/integration/pages/NotFound",
	"com/bmc/hcm/erf/test/integration/pages/Browser",
	"com/bmc/hcm/erf/test/integration/pages/App"
], function (Opa5, Common) {
	"use strict";
	Opa5.extendConfig({
		arrangements: new Common(),
		viewNamespace: "com.bmc.hcm.erf.view."
	});

	sap.ui.require([
		"com/bmc/hcm/erf/test/integration/WorklistJourney",
		"com/bmc/hcm/erf/test/integration/ObjectJourney",
		"com/bmc/hcm/erf/test/integration/NavigationJourney",
		"com/bmc/hcm/erf/test/integration/NotFoundJourney",
		"com/bmc/hcm/erf/test/integration/FLPIntegrationJourney"
	], function () {
		QUnit.start();
	});
});