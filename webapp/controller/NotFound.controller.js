sap.ui.define([
		"com/bmc/hcm/erf/controller/BaseController"
	], function (BaseController) {
		"use strict";

		return BaseController.extend("com.bmc.hcm.erf.controller.NotFound", {

			/**
			 * Navigates to the worklist when the link is pressed
			 * @public
			 */
			onLinkPressed : function () {
				this.getRouter().navTo("worklist");
			}

		});

	}
);