/*global _*/
sap.ui.define([
	"sap/ui/core/Control",
	"sap/m/Button"
], function (Control, Button) {
	"use strict";

	var E = Control.extend("com.bmc.hcm.erf.control.DisplayCard", {

		metadata: {
			properties: {
				"headerText": {
					type: "string",
					bindable: true
				},
				"contentText": {
					type: "string",
					bindable: true
				},
				"buttonText": {
					type: "string",
					bindable: true
				},
				"imageClass": {
					type: "string",
					bindable: true
				},
				"isPosted": {
					type: "boolean",
					default: false
				}
			},
			aggregations: {
				_button: {
					type: "sap.m.Button",
					multiple: false
				},
				_content: {
					type: "sap.ui.core.Control",
					multiple: false
				}
			},
			events: {
				"actionSelected": {}
			}

		},

		init: function () {
			var libraryPath = jQuery.sap.getModulePath("com.bmc.hcm.erf"); //get the server location of the ui library
			jQuery.sap.includeStyleSheet(libraryPath + "/control/DisplayCard.css");

			this.setAggregation("_button", new Button({
				press: this._onButtonPressed.bind(this),
				type: "Accept"
			}).addStyleClass("sapUiTinyMarginTopBottom"));
		},

		_onButtonPressed: function () {
			this.fireActionSelected();
		},

		renderer: function (oRM, oControl) {
			var oContentControl = oControl.getAggregation("_content");
			oRM.write("<div"); //Div 0
			oRM.writeControlData(oControl);
			oRM.addClass("display-card-wide mdl-card mdl-shadow--3dp");
			oRM.writeClasses();
			oRM.write(">");
			oRM.write("<div"); // Div 1
			oRM.addClass("mdl-card__title");
			if (oControl.getIsPosted()) {
				oRM.addClass("mdl-card__posted");
			}
			oRM.writeClasses();
			oRM.write(">");

			if (oControl.getImageClass()) {
				oRM.write("<div"); // Div 1
				oRM.addClass("mdl-card__image");
				oRM.addClass(oControl.getImageClass());
				oRM.writeClasses();
				oRM.write("></div>");
			}

			oRM.write("<h2");
			oRM.addClass("mdl-card__title-text");
			oRM.writeClasses();
			oRM.write(">");
			oRM.write(oControl.getHeaderText());
			oRM.write("</h2>");
			oRM.write("</div>"); // Div 1
			oRM.write("<div"); // Div 2
			oRM.addClass("mdl-card__supporting-text");
			oRM.writeClasses();
			oRM.write(">");
			if (oContentControl && oContentControl.getVisible()) {
				oRM.renderControl(oContentControl);
			} else {
				oRM.write(oControl.getContentText());
			}
			oRM.write("</div>"); // Div 2

			oRM.write("<div"); // Div 3
			oRM.addClass("mdl-card__actions mdl-card--border");
			oRM.writeClasses();
			oRM.write(">");
			oControl.getAggregation("_button").setText(oControl.getButtonText());
			oRM.renderControl(oControl.getAggregation("_button"));
			// oRM.write("<a data-buttonId='cardAction'"); // Button
			// oRM.addClass("mdl-button mdl-button--raised mdl-button--colored mdl-js-button mdl-js-ripple-effect");
			// oRM.writeClasses();
			// oRM.write(">");
			// oRM.write(oControl.getButtonText());
			// oRM.write("</a>");
			oRM.write("</div>"); // Div 3

			oRM.write("</div>"); // Div 0
		}
	});

	E.prototype.ontap = function (e) {

		if ($(e.originalEvent.target).data("buttonid") === "cardAction") {
			this.fireActionSelected(e);
		}

	};

	return E;

});