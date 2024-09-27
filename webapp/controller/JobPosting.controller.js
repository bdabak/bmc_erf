/*global location*/
/*global _*/
sap.ui.define([
	"com/bmc/hcm/erf/controller/BaseController",
	"com/bmc/hcm/erf/controller/SharedData",
	"sap/ui/model/json/JSONModel",
	"sap/ui/core/routing/History",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"com/bmc/hcm/erf/utils/FormValidator",
	"sap/m/MessageToast",
	"sap/m/MessageBox",
	"com/bmc/hcm/erf/model/formatter"
], function (
	BaseController,
	SharedData,
	JSONModel,
	History,
	Filter,
	FilterOperator,
	FormValidator,
	MessageToast,
	MessageBox,
	formatter
) {
	"use strict";

	return BaseController.extend("com.bmc.hcm.erf.controller.JobPosting", {

		formatter: formatter,
		_formFragments: {},

		/* =========================================================== */
		/* lifecycle methods                                           */
		/* =========================================================== */

		/**
		 * Called when the employeerequest controller is instantiated.
		 * @public
		 */
		onInit: function () {
			// Model used to manipulate control states. The chosen values make sure,
			// detail page is busy indication immediately so there is no break in
			// between the busy indication for loading the view's meta data
			var oInternalJobPostingModel = new JSONModel(),
				oExternalJobPostingModel = new JSONModel();

			this.getRouter().getRoute("internaljobposting").attachPatternMatched(this._onInternalJobPostingMatched, this);
			this.getRouter().getRoute("externaljobposting").attachPatternMatched(this._onExternalJobPostingMatched, this);
			this.setModel(oInternalJobPostingModel, "internalJobPostingModel");
			this.setModel(oExternalJobPostingModel, "externalJobPostingModel");

			this._initiateModels();
			this.initOperations();

			var oReqQualRTE = this.byId("idExternalPostingRequiredQualificationsRTE");
			if (oReqQualRTE) oReqQualRTE.addButtonGroup("styleselect").addButtonGroup("table");
			var oJobDescRTE = this.byId("idExternalPostingJobDescriptionRTE");
			if (oJobDescRTE) oJobDescRTE.addButtonGroup("styleselect").addButtonGroup("table");

		},

		onExit: function () {
			this._initiateModels();
			for (var sPropertyName in this._formFragments) {
				if (!this._formFragments.hasOwnProperty(sPropertyName)) {
					return;
				}

				this._formFragments[sPropertyName].destroy();
				this._formFragments[sPropertyName] = null;
			}
		},

		/* =========================================================== */
		/* event handlers                                              */
		/* =========================================================== */
		onNavBack: function (oEvent) {
			this._initiateModels();
			this.goBack(History);
		},
		onNavBackReview: function (oEvent) {
			var oNavContainer = this.byId("idInternalJobPostingNavContainer");
			oNavContainer.backToTop();
		},

		onInternalJobPostingPrepared: function () {
			var oNavContainer = this.byId("idInternalJobPostingNavContainer");
			var oReviewPage = this.byId("idInternalJobPostingDisplayPage");
			oReviewPage.bindElement({
				path: "/",
				model: "internalJobPostingModel"
			});
			oNavContainer.to(oReviewPage);
		},
		onValidateInternalJobPostingSteps: function () {
			var oInternalJobPostingModel = this.getModel("internalJobPostingModel");
			var oWizardData = oInternalJobPostingModel.getData();
			var oWizard = this.byId("idInternalJobPostingWizard");
			try {
				if (oWizardData.postingData.Butxt.length > 0 && oWizardData.postingData.Orgtx.length > 0 &&
					oWizardData.postingData.Plstx.length > 0) {
					if (_.isDate(oWizardData.postingData.Begda) && _.isDate(oWizardData.postingData.Endda)) {
						oWizardData.postingData.Begda.setHours(9);
						oWizardData.postingData.Endda.setHours(9);
						if (oWizardData.postingData.Endda > oWizardData.postingData.Begda) {
							oWizardData.stepOneValid = true;
						} else {
							oWizardData.stepOneValid = false;
							this._callMessageToast(this.getText("POSTING_DATE_ENDDA_LESS_BEGDA"), "E");
						}
					} else {
						oWizardData.stepOneValid = false;
					}

				} else {
					oWizardData.stepOneValid = false;
				}

				if (oWizardData.postingData.Erfrq.length > 0) {
					oWizardData.stepTwoValid = true;
				} else {
					oWizardData.stepTwoValid = false;
				}

				if (oWizardData.postingData.Erfjd.length > 0) {
					oWizardData.stepThreeValid = true;
				} else {
					oWizardData.stepThreeValid = false;
				}
			} catch (oErr) {
				oWizardData.stepOneValid = false;
			}

			if (!oWizardData.stepOneValid) {
				oWizard.setCurrentStep("idInternalJobPostingStep1");
				oWizardData.stepTwoValid = false;
				oWizardData.stepThreeValid = false;
			} else if (!oWizardData.stepTwoValid) {
				oWizard.setCurrentStep("idInternalJobPostingStep2");
				oWizardData.stepThreeValid = false;
			} else if (!oWizardData.stepThreeValid) {
				oWizard.setCurrentStep("idInternalJobPostingStep3");
			}

			oInternalJobPostingModel.setData(oWizardData);

		},
		onInternalPostingCreate: function () {
			var oModel = this.getModel();
			var oInternalJobPostingModel = this.getModel("internalJobPostingModel");
			var oPostingData = oInternalJobPostingModel.getProperty("/postingData");
			var sPath = oModel.createKey("/JobPostingSet", {
				Erfid: oPostingData.Erfid
			});
			var oThis = this;
			var oNavContainer = this.byId("idInternalJobPostingNavContainer");

			this._openBusyFragment("INTERNAL_POSTING_BEING_SAVED", []);
			oModel.update(sPath, oPostingData, {
				success: function (oData) {
					oThis._closeBusyFragment();
					oThis._callMessageToast(oThis.getText("INTERNAL_POSTING_SAVED"), "S");
					oNavContainer.backToTop();
					SharedData.setForceRefresh(true); //Force to refresh
					oThis.onNavBack();
				},
				error: function () {
					oThis._closeBusyFragment();
				}
			});
		},

		onHandleGenericValueHelp: function (oEvent) {
			var oSource = oEvent.getSource();
			var aData = oSource.data();
			var sTitle = this.getText(oSource.data("helpKey") + "_SELECTION");
			var sFieldType = oSource.data("fieldType");
			var sHelpKey = oSource.data("helpKey");
			if (!this._oKariyerValueHelpDialog) {
				this._oKariyerValueHelpDialog = sap.ui.xmlfragment(
					"com.bmc.hcm.erf.fragment.KariyerNetGenericSearch",
					this
				);
				this.getView().addDependent(this._oKariyerValueHelpDialog);
			}

			this._oKariyerValueHelpDialog.getBinding("items").filter(new Filter("Help", FilterOperator.EQ, sHelpKey));
			this._oKariyerValueHelpDialog.getBinding("items").refresh();
			this._oKariyerValueHelpDialog.setRememberSelections(false);
			this._oKariyerValueHelpDialog.data(aData);
			this._oKariyerValueHelpDialog.setTitle(sTitle);
			this._oKariyerValueHelpDialog.setMultiSelect(sFieldType === "Array");
			this._oKariyerValueHelpDialog.open();
		},
		onCancelSearch: function (oEvent) {
			this._oKariyerValueHelpDialog.getBinding("items").filter(new Filter("Help", FilterOperator.EQ, "DUMMY"));
			this._oKariyerValueHelpDialog.getBinding("items").refresh();
			this._oKariyerValueHelpDialog.setRememberSelections(false);
		},
		onPerformSearch: function (oEvent) {
			var sValue = oEvent.getParameter("value");
			var aFilters = [];
			var sHelpKey = this._oKariyerValueHelpDialog.data("helpKey");

			aFilters.push(new Filter("Help", FilterOperator.EQ, sHelpKey));
			aFilters.push(new Filter("Query", FilterOperator.EQ, sValue));

			oEvent.getSource().getBinding("items").filter(aFilters);
		},
		onConfirmSelection: function (oEvent) {
			var aSelectedContext = oEvent.getParameter("selectedContexts");
			var oExternalJobPostingModel = this.getModel("externalJobPostingModel");
			var sFieldType = this._oKariyerValueHelpDialog.data("fieldType");
			var sTargetField = this._oKariyerValueHelpDialog.data("targetField");
			var sTargetTextField = this._oKariyerValueHelpDialog.data("targetTextField");
			var aItems = oExternalJobPostingModel.getProperty(sTargetField);
			var oThis = this;

			if (aSelectedContext) {
				if (sFieldType === "Array") {
					aSelectedContext.map(function (oContext) {
						var oSelectedObject = oContext.getObject();
						var oExist = _.find(aItems, ["Key", oSelectedObject.Key]);
						if (oExist) {
							oThis._callMessageToast(oThis.getText("ALREADY_ADDED", [oSelectedObject.Text]), "W");
						} else {
							aItems.push({
								Key: oSelectedObject.Key,
								Text: oSelectedObject.Text
							});
						}
					});
					oExternalJobPostingModel.setProperty(sTargetField, aItems);
				} else {
					var oSingleObject = aSelectedContext[0].getObject();
					oExternalJobPostingModel.setProperty(sTargetField, oSingleObject.Key);
					if (sTargetTextField) {
						oExternalJobPostingModel.setProperty(sTargetTextField, oSingleObject.Text);
					}
				}

			}

			oEvent.getSource().getBinding("items").filter(new Filter("Help", FilterOperator.EQ, "DUMMY"));
			oEvent.getSource().getBinding("items").refresh();
			this._oKariyerValueHelpDialog.setRememberSelections(false);
		},

		onHandleTokenDelete: function (oEvent) {
			var oSource = oEvent.getSource();
			var sTargetField = oSource.data("targetField");
			var oExternalJobPostingModel = this.getModel("externalJobPostingModel");
			var aPrev = oExternalJobPostingModel.getProperty(sTargetField);
			var aRemovedToken = oEvent.getParameter("removedTokens");

			try {
				_.remove(aPrev, ["Key", aRemovedToken[0].getKey()]);
				oExternalJobPostingModel.setProperty(sTargetField, aPrev);
			} catch (oEx) {
				jQuery.sap.log.error(oEx);
			}

		},
		onHandleRadioButtonChange: function (oEvent) {
			var oExternalJobPostingModel = this.getModel("externalJobPostingModel");
			var oSource = oEvent.getSource();
			var sField = oSource.data("targetField");
			var sValue = oSource.data("radioValue");

			oExternalJobPostingModel.setProperty("/postingData/" + sField, sValue);
		},

		onAddNewForeignLanguage: function (oEvent) {
			var oExternalJobPostingModel = this.getModel("externalJobPostingModel");
			var aLang = oExternalJobPostingModel.getProperty("/KariyerNetForeignLanguageSelected");

			if (aLang.length >= 5) {
				this._callMessageToast(this.getText("MAX_ENTRIES_REACHED"), "W");
				return;
			}

			aLang.push({
				"Lanid": "",
				"Lanrd": "",
				"Lanwr": "",
				"Lansp": ""
			});

			oExternalJobPostingModel.setProperty("/KariyerNetForeignLanguageSelected", aLang);
		},
		onDeleteForeignLanguage: function (oEvent) {
			var oSource = oEvent.getSource();
			var sPath = oSource.getParent().getBindingContextPath();
			var sRow = sPath.substring(sPath.lastIndexOf('/') + 1);
			var oExternalJobPostingModel = this.getModel("externalJobPostingModel");
			var aLang = oExternalJobPostingModel.getProperty("/KariyerNetForeignLanguageSelected");

			aLang.splice(sRow, 1);

			oExternalJobPostingModel.setProperty("/KariyerNetForeignLanguageSelected", aLang);
		},
		onSaveExternalJobPosting: function () {
			var oModel = this.getModel();
			var oThis = this;
			var oPostingData = this._convertExternalJobPostingUIToOdata();

			oPostingData.Actio = 'SAVE';

			if (!this._validateForm()) {
				return;
			}

			this._openBusyFragment("EXTERNAL_POSTING_BEING_SAVED", []);
			oModel.create("/JobPostingExtSet", oPostingData, {
				success: function (oData) {
					oThis._closeBusyFragment();
					oThis._callMessageToast(oThis.getText("EXTERNAL_POSTING_SAVED"), "S");
				},
				error: function () {
					oThis._closeBusyFragment();
				}
			});
		},
		onPublishExternalJobPosting: function () {
			var oModel = this.getModel();
			var oThis = this;
			var oPostingData = this._convertExternalJobPostingUIToOdata();

			oPostingData.Actio = 'PUBLISH';

			if (!this._validateForm()) {
				return;
			}

			var _doPublish = function () {
				oThis._openBusyFragment("EXTERNAL_POSTING_BEING_SAVED", []);
				oModel.create("/JobPostingExtSet", oPostingData, {
					success: function (oData) {
						oThis._closeBusyFragment();
						if (oData.ReturnMessage.Type === "S") {
							oThis._callMessageToast(oThis.getText("EXTERNAL_POSTING_PUBLISHED"), "S");
							SharedData.setForceRefresh(true); //Force to refresh
							oThis.onNavBack();
						} else {
							MessageBox.error(oData.ReturnMessage.Message);
						}
					},
					error: function () {
						oThis._closeBusyFragment();
					}
				});
			};

			var oBeginButtonProp = {
				text: this.getText("PUBLISH_ACTION"),
				type: "Accept",
				icon: "sap-icon://marketing-campaign",
				onPressed: _doPublish
			};

			this._callConfirmDialog(this.getText("CONFIRMATION_REQUIRE"), "Message", "Warning", this.getText(
					"EXTERNAL_JOB_POSTING_CONFIRMATION"),
				oBeginButtonProp, null).open();

		},
		/* =========================================================== */
		/* internal methods                                            */
		/* =========================================================== */
		_setChangeListeners: function () {
			var oExternalJobPostingModel = this.getModel("externalJobPostingModel");
			var oThis = this;
			var oListenedModel = new sap.ui.model.Binding(oExternalJobPostingModel, "/", oExternalJobPostingModel.getContext("/postingData"));
			oListenedModel.attachChange(function (oEvent) {
				oThis._clearValidationTraces();
			}, this);
		},
		_validateForm: function () {
			var oValidator = new FormValidator(this);
			var oExternalJobPostingModel = this.getModel("externalJobPostingModel");
			var oPostingData = oExternalJobPostingModel.getProperty("/postingData");
			var aFormList = ["idExternalPostingCompanyInfo", "idExternalPostingDetailsPart1", "idExternalPostingDetailsPart2",
				"idExternalCandidateInfoPart1", "idExternalCandidateInfoPart2"
			];
			var sValid = true;
			var oThis = this;

			$.each(aFormList, function (sKey, sForm) {
				var oFormToValidate = oThis.byId(sForm);

				if (oFormToValidate) {
					var sResult = oValidator.validate(oFormToValidate);

					if (!sResult) sValid = false;
				}
			});

			if (!sValid) {
				this._callMessageToast(this.getText("FORM_HAS_ERRORS"), "E");
				return false;
			} else {
				return true;
			}
		},
		_clearValidationTraces: function () {
			var oValidator = new FormValidator(this);
			var aFormList = ["idExternalPostingCompanyInfo", "idExternalPostingDetailsPart1", "idExternalPostingDetailsPart2",
				"idExternalCandidateInfoPart1", "idExternalCandidateInfoPart2"
			];
			var oThis = this;
			$.each(aFormList, function (sKey, sForm) {
				var oFormToValidate = oThis.byId(sForm);

				if (oFormToValidate) {
					oValidator.clearTraces(oFormToValidate);
				}
			});

		},
		_getPositionText: function (sPosid) {
			var oExternalJobPostingModel = this.getModel("externalJobPostingModel");
			var oPosition = {};
			var oModel = this.getModel();

			if (!sPosid || sPosid === "") {
				return "";
			}

			oPosition = oModel.getProperty("/KariyerNetValueHelpSet(Help='POSITION',Key='" + sPosid + "')");

			if (oPosition) {
				return oPosition.Text + " (" + sPosid + ")";
			}

			var aPositionList = oExternalJobPostingModel.getProperty("/KariyetNetPositionList");

			oPosition = _.find(aPositionList, {
				"Help": "POSITION",
				"Key": sPosid
			});

			if (oPosition) {
				return oPosition.Text + " (" + sPosid + ")";
			} else {
				return "Metin bulunamadı" + " (" + sPosid + ")";
			}

		},
		_refreshPositionList: function () {
			var oModel = this.getModel();
			var oExternalJobPostingModel = this.getModel("externalJobPostingModel");
			var aFilters = [];
			aFilters.push(new Filter("Help", sap.ui.model.FilterOperator.EQ, "POSITION_LIST"));

			oModel.read("/KariyerNetValueHelpSet", {
				filters: aFilters,
				success: function (oData) {
					oExternalJobPostingModel.setProperty("/KariyetNetPositionList", oData.results);
					oExternalJobPostingModel.refresh(true);
				},
				error: function (oError) {

				}
			});
		},
		/**
		 * Initiate models
		 * @function
		 * @param {sap.ui.base.Event} oEvent pattern match event in route 'object'
		 * @private
		 */
		_initiateModels: function () {
			var oInternalJobPostingModel = this.getModel("internalJobPostingModel");
			var oExternalJobPostingModel = this.getModel("externalJobPostingModel");

			oInternalJobPostingModel.setData({
				"postingData": {},
				"stepOneValid": false,
				"stepTwoValid": false,
				"stepThreeValid": false,
				"currentStep": "idInternalJobPostingStep1"
			});
			oExternalJobPostingModel.setData({
				"postingData": {},
				"KariyerNetSectorSelected": [],
				"KariyerNetJobAreaSelected": [],
				"KariyerNetEducationSelected": [],
				"KariyerNetWorkExpPosSelected": [],
				"KariyerNetWorkExpSecSelected": [],
				"KariyerNetUniversitySelected": [],
				"KariyerNetUniversityDepSelected": [],
				"KariyerNetPositionLocationSelected": [],
				"KariyerNetCandidateLocationSelected": [],
				"KariyerNetMilitaryStatusSelected": [],
				"KariyerNetForeignLanguageSelected": [],
				"KariyetNetPositionList": []
			});
		},
		/**
		 * Pattern matched
		 * @function
		 * @param {sap.ui.base.Event} oEvent pattern match event in route 'object'
		 * @private
		 */
		_onInternalJobPostingMatched: function (oEvent) {
			var sErfid = oEvent.getParameter("arguments").Erfid;
			var oModel = this.getModel();
			var oInternalJobPostingModel = this.getModel("internalJobPostingModel");

			var oThis = this;

			var sPath = oModel.createKey("/JobPostingSet", {
				Erfid: sErfid
			});

			// oWizardPage.bindElement({
			// 	path: "/",
			// 	model: "internalJobPostingModel"
			// });

			oInternalJobPostingModel.setData({
				"postingData": {},
				"stepOneValid": false,
				"stepTwoValid": false,
				"stepThreeValid": false
			});

			this._openBusyFragment("INTERNAL_POSTING_BEING_READ", []);
			oModel.read(sPath, {
				success: function (oData) {
					oThis._closeBusyFragment();
					oInternalJobPostingModel.setProperty("/postingData", oData);
					oThis._setInitialWizardStep();
					oThis.onValidateInternalJobPostingSteps();
				},
				error: function () {
					oThis._closeBusyFragment();
				}
			});

		},
		_onExternalJobPostingMatched: function (oEvent) {
			var sErfid = oEvent.getParameter("arguments").Erfid;

			var oModel = this.getModel();
			var oExternalJobPostingModel = this.getModel("externalJobPostingModel");

			var oThis = this;

			var sPath = oModel.createKey("/JobPostingExtSet", {
				Erfid: sErfid
			});

			this._initiateModels();
			this._refreshPositionList();

			var sExpand = "KariyerNetPositionLocationSet" +
				",KariyerNetSectorSet" + ",KariyerNetJobAreaSet" + ",KariyerNetEducationSet" +
				",KariyerNetWorkExpPosSet" +
				",KariyerNetWorkExpSecSet" + ",KariyerNetUniversitySet" + ",KariyerNetUniversityDepSet" + ",KariyerNetLanguageSet" +
				",KariyerNetCandidateLocationSet" + ",KariyerNetValueHelpSet" + ",KariyerNetMilitaryStatusSet";

			this._openBusyFragment("EXTERNAL_POSTING_BEING_READ", []);
			oModel.read(sPath, {
				urlParameters: {
					"$expand": sExpand
				},
				success: function (oData) {
					oThis._closeBusyFragment();
					oExternalJobPostingModel.setProperty("/postingData", oData);
					oThis._setChangeListeners();
					oThis._convertExternalJobPostingOdataToUI(oData);
				},
				error: function () {
					oThis._closeBusyFragment();
				}
			});

		},
		_setInitialWizardStep: function () {
			var oWizard = this.byId("idInternalJobPostingWizard");
			try {
				oWizard.discardProgress(oWizard.getSteps()[0]);
			} catch (oErr) {
				jQuery.sap.log.error("Wizard set current step error");
			}
		},
		_convertExternalJobPostingUIToOdata: function () {
			var oExternalJobPostingModel = this.getModel("externalJobPostingModel");
			var oPostingData = oExternalJobPostingModel.getProperty("/postingData");
			var aSector = oExternalJobPostingModel.getProperty("/KariyerNetSectorSelected");
			var aJobArea = oExternalJobPostingModel.getProperty("/KariyerNetJobAreaSelected");
			var aEducation = oExternalJobPostingModel.getProperty("/KariyerNetEducationSelected");
			var aWorkExpPos = oExternalJobPostingModel.getProperty("/KariyerNetWorkExpPosSelected");
			var aWorkExpSec = oExternalJobPostingModel.getProperty("/KariyerNetWorkExpSecSelected");
			var aUniversity = oExternalJobPostingModel.getProperty("/KariyerNetUniversitySelected");
			var aUniversityDep = oExternalJobPostingModel.getProperty("/KariyerNetUniversityDepSelected");
			var aPosLocation = oExternalJobPostingModel.getProperty("/KariyerNetPositionLocationSelected");
			var aCanLocation = oExternalJobPostingModel.getProperty("/KariyerNetCandidateLocationSelected");
			var aMilitary = oExternalJobPostingModel.getProperty("/KariyerNetMilitaryStatusSelected");
			var aLanguage = oExternalJobPostingModel.getProperty("/KariyerNetForeignLanguageSelected");

			var oData = _.clone(oPostingData);

			oData.KariyerNetCandidateLocationSet = [];
			oData.KariyerNetPositionLocationSet = [];
			oData.KariyerNetEducationSet = [];
			oData.KariyerNetJobAreaSet = [];
			oData.KariyerNetLanguageSet = [];
			oData.KariyerNetSectorSet = [];
			oData.KariyerNetUniversitySet = [];
			oData.KariyerNetUniversityDepSet = [];
			oData.KariyerNetWorkExpPosSet = [];
			oData.KariyerNetWorkExpSecSet = [];
			oData.KariyerNetMilitaryStatusSet = [];
			oData.ReturnMessage = {};

			$.each(aCanLocation, function (sKey, oLocation) {
				oData.KariyerNetCandidateLocationSet.push({
					Key: oLocation.Key,
					Text: oLocation.Text
				});
			});

			$.each(aEducation, function (sKey, oEducation) {
				oData.KariyerNetEducationSet.push({
					Key: oEducation
				});
			});

			$.each(aJobArea, function (sKey, oJobArea) {
				oData.KariyerNetJobAreaSet.push({
					Key: oJobArea.Key,
					Text: oJobArea.Text
				});
			});

			$.each(aLanguage, function (sKey, oLanguage) {
				oData.KariyerNetLanguageSet.push({
					Lanid: oLanguage.Lanid,
					Lanrd: oLanguage.Lanrd,
					Lanwr: oLanguage.Lanwr,
					Lansp: oLanguage.Lansp
				});
			});

			$.each(aPosLocation, function (sKey, oPosLocation) {
				oData.KariyerNetPositionLocationSet.push({
					Key: oPosLocation.Key,
					Text: oPosLocation.Text
				});
			});

			$.each(aSector, function (sKey, oSector) {
				oData.KariyerNetSectorSet.push({
					Key: oSector.Key,
					Text: oSector.Text
				});
			});

			$.each(aUniversity, function (sKey, oUniversity) {
				oData.KariyerNetUniversitySet.push({
					Key: oUniversity.Key,
					Text: oUniversity.Text
				});
			});

			$.each(aUniversityDep, function (sKey, oUniversityDep) {
				oData.KariyerNetUniversityDepSet.push({
					Key: oUniversityDep.Key,
					Text: oUniversityDep.Text
				});
			});

			$.each(aWorkExpPos, function (sKey, oExpPos) {
				oData.KariyerNetWorkExpPosSet.push({
					Key: oExpPos.Key,
					Text: oExpPos.Text
				});
			});
			$.each(aWorkExpSec, function (sKey, oExpSec) {
				oData.KariyerNetWorkExpSecSet.push({
					Key: oExpSec.Key,
					Text: oExpSec.Text
				});
			});

			$.each(aMilitary, function (sKey, oMilitary) {
				oData.KariyerNetMilitaryStatusSet.push({
					Key: oMilitary
				});
			});

			return oData;
		},
		_convertExternalJobPostingOdataToUI: function (oData) {
			var oExternalJobPostingModel = this.getModel("externalJobPostingModel");
			var aSector = [];
			var aJobArea = [];
			var aEducation = [];
			var aWorkExpPos = [];
			var aWorkExpSec = [];
			var aUniversity = [];
			var aUniversityDep = [];
			var aPosLocation = [];
			var aCanLocation = [];
			var aMilitary = [];
			var aLanguage = [];

			$.each(oData.KariyerNetCandidateLocationSet.results, function (sKey, oLocation) {
				aCanLocation.push({
					Key: oLocation.Key,
					Text: oLocation.Text
				});
			});

			$.each(oData.KariyerNetEducationSet.results, function (sKey, oEducation) {
				aEducation.push(oEducation.Key);
			});

			$.each(oData.KariyerNetJobAreaSet.results, function (sKey, oJobArea) {
				aJobArea.push({
					Key: oJobArea.Key,
					Text: oJobArea.Text
				});
			});

			$.each(oData.KariyerNetLanguageSet.results, function (sKey, oLanguage) {
				aLanguage.push({
					Lanid: oLanguage.Lanid,
					Lanrd: oLanguage.Lanrd,
					Lanwr: oLanguage.Lanwr,
					Lansp: oLanguage.Lansp
				});
			});

			$.each(oData.KariyerNetPositionLocationSet.results, function (sKey, oPosLocation) {
				aPosLocation.push({
					Key: oPosLocation.Key,
					Text: oPosLocation.Text
				});
			});

			$.each(oData.KariyerNetSectorSet.results, function (sKey, oSector) {
				aSector.push({
					Key: oSector.Key,
					Text: oSector.Text
				});
			});

			$.each(oData.KariyerNetUniversitySet.results, function (sKey, oUniversity) {
				aUniversity.push({
					Key: oUniversity.Key,
					Text: oUniversity.Text
				});
			});

			$.each(oData.KariyerNetUniversityDepSet.results, function (sKey, oUniversityDep) {
				aUniversityDep.push({
					Key: oUniversityDep.Key,
					Text: oUniversityDep.Text
				});
			});

			$.each(oData.KariyerNetWorkExpPosSet.results, function (sKey, oExpPos) {
				aWorkExpPos.push({
					Key: oExpPos.Key,
					Text: oExpPos.Text
				});
			});
			$.each(oData.KariyerNetWorkExpSecSet.results, function (sKey, oExpSec) {
				aWorkExpSec.push({
					Key: oExpSec.Key,
					Text: oExpSec.Text
				});
			});

			$.each(oData.KariyerNetMilitaryStatusSet.results, function (sKey, oMilitary) {
				aMilitary.push(oMilitary.Key);
			});

			oExternalJobPostingModel.setProperty("/KariyerNetSectorSelected", aSector);
			oExternalJobPostingModel.setProperty("/KariyerNetJobAreaSelected", aJobArea);
			oExternalJobPostingModel.setProperty("/KariyerNetEducationSelected", aEducation);
			oExternalJobPostingModel.setProperty("/KariyerNetWorkExpPosSelected", aWorkExpPos);
			oExternalJobPostingModel.setProperty("/KariyerNetWorkExpSecSelected", aWorkExpSec);
			oExternalJobPostingModel.setProperty("/KariyerNetUniversitySelected", aUniversity);
			oExternalJobPostingModel.setProperty("/KariyerNetUniversityDepSelected", aUniversityDep);
			oExternalJobPostingModel.setProperty("/KariyerNetPositionLocationSelected", aPosLocation);
			oExternalJobPostingModel.setProperty("/KariyerNetCandidateLocationSelected", aCanLocation);
			oExternalJobPostingModel.setProperty("/KariyerNetMilitaryStatusSelected", aMilitary);
			oExternalJobPostingModel.setProperty("/KariyerNetForeignLanguageSelected", aLanguage);

		},
		/**
		 * Gets the default request
		 * @function
		 * @param sFragmentName type string, name of the fragment
		 * @private 
		 */
		_getFragment: function (sFragmentName) {
			var oFormFragment = this._formFragments[sFragmentName];

			if (oFormFragment) {
				return oFormFragment;
			}

			oFormFragment = sap.ui.xmlfragment("com.bmc.hcm.erf.fragment." + sFragmentName, this);

			this._formFragments[sFragmentName] = oFormFragment;
			return this._formFragments[sFragmentName];
		}

	});

});