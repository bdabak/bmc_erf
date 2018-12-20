sap.ui.define([
	"sap/m/Wizard"
], function (Wizard) {
	"use strict";

	return Wizard.extend("com.bmc.hcm.erf.control.WizardExtend", {

		renderer: {},

		addStep: function (wizardStep) {
			this._incrementStepCount();
			return this.addAggregation("steps", wizardStep);
		}
	});
});