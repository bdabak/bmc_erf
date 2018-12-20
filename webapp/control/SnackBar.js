sap.ui.define([
	"sap/ui/core/Control"
], function (Control) {
	"use strict";

	var E = Control.extend("com.bmc.hcm.erf.control.SnackBar", {

		metadata: {
			properties: {
				"message": {
					type: "string"
				}
			}

		},

		init: function () {
			var libraryPath = jQuery.sap.getModulePath("com.bmc.hcm.erf"); //get the server location of the ui library
			jQuery.sap.includeStyleSheet(libraryPath + "/control/SnackBar.css");
		},

		renderer: function (oRM, oControl) {
			oRM.write("<div");
			oRM.writeControlData(oControl);
			oRM.addClass("mdl-js-snackbar mdl-snackbar");
			oRM.writeClasses();
			oRM.write(">");
			oRM.write("<div");
			oRM.addClass("mdl-snackbar__text");
			oRM.writeClasses();
			oRM.write("></div>");
			oRM.write("<button");
			oRM.addClass("mdl-snackbar__action");
			oRM.writeClasses();
			oRM.write("type='button' />");
			oRM.write("</div>");
		}
	});

	return E;

});