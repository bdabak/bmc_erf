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
	"sap/ui/richtexteditor/RichTextEditor",
	"sap/ui/core/util/Export",
	"sap/ui/core/util/ExportTypeCSV",
	"sap/ui/core/util/ExportType",
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
	RichTextEditor,
	Export,
	ExportTypeCSV,
	ExportType,
	formatter
) {
	"use strict";

	return BaseController.extend("com.bmc.hcm.erf.controller.EmployeeRequest", {

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
			var oViewModel = new JSONModel({
					busy: false,
					delay: 0,
					request: null,
					requestDefaults: null,
					positionList: null,
					organizationList: null,
					positionListProxy: null,
					organizationListProxy: null,
					positionHelp: {
						enableAdd: false
					},
					organizationHelp: {
						enableAdd: false
					},
					formActions: [],
					upperLevelJobs: [],
					formHistory: [],
					candidateList: [],
					candidateCount: 0,
					requestOwner: null,
					statusChangeDialog: null,
					candidateListStyle: "display-in-table"
				}),
				oCandidateList = new JSONModel({
					SearchResults: {
						"C": 0,
						"P": 0,
						"R": 0
					},
					FilterBarExpanded: false,
					CandidateActionSettings: {
						DiscardFromPool: false,
						AssignToPotential: false,
						AssignToRejected: false,
						ActionsColumnVisible: false,
						SelectColumnVisible: false
					},
					Filters: {
						"Cplty": "C",
						"Ename": "",
						"Gesch": "",
						"Slart": "",
						"Wdart": "",
						"Lstcm": "",
						"Lstps": "",
						"Hscmn": false,
						"Hasrf": false,
						"Isvic": false
					}
				});

			this.getRouter().getRoute("employeerequestnew").attachPatternMatched(this._onNewRequestMatched, this);
			this.getRouter().getRoute("employeerequestedit").attachPatternMatched(this._onRequestMatched, this);

			this.setModel(oViewModel, "employeeRequestView");
			this.setModel(oCandidateList, "candidateListModel");
			this.initOperations();
		},

		onExit: function () {
			this._initiateModels();

		},

		/* =========================================================== */
		/* event handlers                                              */
		/* =========================================================== */
		onCancelForm: function (oEvent) {
			this.getRouter().navTo("appdispatcher", {}, true);
			this._initiateModels();
		},
		onNavBack: function (oEvent) {
			this.getRouter().navTo("appdispatcher", {}, true);
			this._initiateModels();
		},
		onResetEmployee: function (oEvent) {
			var oViewModel = this.getModel("employeeRequestView");
			var sSourceField = oEvent.getSource().data("sourceField");
			var sTextField = "";

			switch (sSourceField) {
			case "Leaem":
				sTextField = "Leaen";
				break;
			case "Trnem":
				sTextField = "Trnen";
				break;
			default:
				jQuery.sap.log.error("Source field not supplied!");
				return;
			}

			oViewModel.setProperty("/request/" + sSourceField, "00000000");
			oViewModel.setProperty("/request/" + sTextField, "");
		},
		onResetPosition: function (oEvent) {
			var oViewModel = this.getModel("employeeRequestView");

			oViewModel.setProperty("/request/Plans", "00000000");
			oViewModel.setProperty("/request/Plstx", "");
			oViewModel.setProperty("/request/Plaft", "");
			oViewModel.setProperty("/request/Stell", "00000000");
			oViewModel.setProperty("/request/Stetx", "");
			oViewModel.setProperty("/request/Orgeh", "00000000");
			oViewModel.setProperty("/request/Orgtx", "");
		},
		onResetFreePosition: function (oEvent) {
			var oViewModel = this.getModel("employeeRequestView");

			oViewModel.setProperty("/request/Nopln", false);
			oViewModel.setProperty("/request/Plaft", "");
			oViewModel.setProperty("/request/Plans", "00000000");
			oViewModel.setProperty("/request/Plstx", "");
			oViewModel.setProperty("/request/Plaft", "");
			oViewModel.setProperty("/request/Stell", "00000000");
			oViewModel.setProperty("/request/Stetx", "");
			oViewModel.setProperty("/request/Orgeh", "00000000");
			oViewModel.setProperty("/request/Orgtx", "");
		},
		onResetOrganization: function (oEvent) {
			var oViewModel = this.getModel("employeeRequestView");

			oViewModel.setProperty("/request/Orgeh", "00000000");
			oViewModel.setProperty("/request/Orgtx", "");
		},

		onResetJob: function (oEvent) {
			var oViewModel = this.getModel("employeeRequestView");

			oViewModel.setProperty("/request/Stell", "00000000");
			oViewModel.setProperty("/request/Stetx", "");
		},

		onEmployeeValueRequest: function (oEvent) {
			var sSourceField = oEvent.getSource().data("sourceField");
			var sInactive = oEvent.getSource().data("includeInactive");

			if (!sInactive || sInactive === "false") {
				sInactive = false;
			} else {
				sInactive = true;
			}

			if (!this._employeeValueHelpDialog) {
				this._employeeValueHelpDialog = sap.ui.xmlfragment(
					"com.bmc.hcm.erf.fragment.EmployeeSearch",
					this
				);
				this.getView().addDependent(this._employeeValueHelpDialog);
			}
			this._employeeValueHelpDialog.setRememberSelections(false);
			this._employeeValueHelpDialog.data("sourceField", sSourceField);
			this._employeeValueHelpDialog.data("includeInactive", sInactive);
			this._employeeValueHelpDialog.open();
		},
		onEmployeeSearch: function (oEvent) {
			var sValue = oEvent.getParameter("value");
			var aFilters = [];
			var sInactive = this._employeeValueHelpDialog.data("includeInactive");

			aFilters.push(new Filter("Ename", FilterOperator.EQ, sValue));

			if (sInactive) {
				aFilters.push(new Filter("Incin", FilterOperator.EQ, true));
			}

			oEvent.getSource().getBinding("items").filter(aFilters);
		},
		onEmployeeSelect: function (oEvent) {
			var oSelectedObject = oEvent.getParameter("selectedContexts")[0].getObject();
			var oViewModel = this.getModel("employeeRequestView");
			var sSourceField = this._employeeValueHelpDialog.data("sourceField");
			var sTextField = "";

			if (oSelectedObject) {
				switch (sSourceField) {
				case "Leaem":
					sTextField = "Leaen";
					break;
				case "Trnem":
					sTextField = "Trnen";
					break;
				default:
					jQuery.sap.log.error("Source field not supplied!");
					return;
				}
				oViewModel.setProperty("/request/" + sSourceField, oSelectedObject.Pernr);
				oViewModel.setProperty("/request/" + sTextField, oSelectedObject.Ename);
			}
			oEvent.getSource().getBinding("items").filter([]);
			oEvent.getSource().getBinding("items").refresh();
			this._employeeValueHelpDialog.setRememberSelections(false);
			this._employeeValueHelpDialog.data("sourceField", null);
			this._employeeValueHelpDialog.data("includeInactive", false);
		},
		onNoPositionSelected: function (oEvent) {
			this.onResetPosition();
		},
		onPositionValueRequest: function (oEvent) {
			var oThis = this;
			var oViewModel = this.getModel("employeeRequestView");
			var sErfrs = oViewModel.getProperty("/request/Erfrs");

			if (sErfrs === "" || sErfrs === "0" || sErfrs === null || sErfrs === undefined) {
				this._callMessageToast(this.getText("SELECT_REQUEST_REASON_FIRST"), "E");
				return;
			}
			var _doCallDialog = function () {
				oThis._positionValueHelpDialog = sap.ui.xmlfragment(
					"com.bmc.hcm.erf.fragment.PositionSearch",
					oThis
				);
				oThis.getView().addDependent(oThis._positionValueHelpDialog);
				oThis._positionValueHelpDialog.open();
			};

			this._refreshPositionUsed(_doCallDialog);
		},
		onPositionTreeToggled: function (oEvent) {
			var oViewModel = this.getModel("employeeRequestView");
			oViewModel.setProperty("/positionHelp/enableAdd", false);
			this._positionSelected = null;
			var oTreeOriginal = this.byId("idPositionTreeOriginal") || sap.ui.getCore().byId("idPositionTreeOriginal");
			var oTreeProxy = this.byId("idPositionTreeProxy") || sap.ui.getCore().byId("idPositionTreeProxy");
			try {
				if (oTreeOriginal) oTreeOriginal.clearSelection();
			} catch (oEx) {
				jQuery.sap.log.error("Tree clear failed");
			}
			try {
				if (oTreeProxy) oTreeProxy.clearSelection();
			} catch (oEx) {
				jQuery.sap.log.error("Tree clear failed");
			}

		},
		onPositionRowSelected: function (oEvent) {
			var oContext = oEvent.getParameters("rowContext");
			var oViewModel = this.getModel("employeeRequestView");
			var oSource = oEvent.getSource();
			var aPositionUsed = oViewModel.getProperty("/usedPositionList");

			var oPosition = null;
			try {
				var sIndices = oSource.getSelectedIndices().length;
				if (sIndices === 0) {
					oSource.clearSelection();
					oViewModel.setProperty("/positionHelp/enableAdd", false);
					this._positionSelected = null;
					return;
				} else if (sIndices > 1) {
					oSource.clearSelection();
					oViewModel.setProperty("/positionHelp/enableAdd", false);
					MessageBox.warning("Sadece bir pozisyon seçiniz");
					this._positionSelected = null;
					return;
				}
				oPosition = oViewModel.getProperty(oContext.rowContext.sPath);
				this._positionHelpTree = oEvent.getSource();
				this._positionSelected = null;

				if (oPosition.Otype === "S") {
					var oUsed = _.find(aPositionUsed, ["Plans", oPosition.Objid]);
					if (oUsed) {
						oSource.clearSelection();
						this._positionSelected = null;
						MessageBox.warning(this.getText("POSITION_SELECTED_BEFORE", [oUsed.Plans, oUsed.Plstx, oUsed.Rqowe, oUsed.Erfno]));
						return;
					} else {
						if (this._checkPositionReasonConsistency(oPosition)) {
							this._positionSelected = oPosition;
							oViewModel.setProperty("/positionHelp/enableAdd", oPosition.Otype === "S" ? true : false);
						} else {
							oSource.clearSelection();
							this._positionSelected = null;
						}
					}
				} else {
					oSource.clearSelection();
					MessageToast.show("Sadece pozisyon ekleyebilirsiniz");
				}

			} catch (oErr) {
				this._positionSelected = null;
				oViewModel.setProperty("/positionHelp/enableAdd", false);
			}

		},
		onPositionAdd: function (oEvent) {
			var oViewModel = this.getModel("employeeRequestView");

			oViewModel.setProperty("/request/Plans", this._positionSelected.Objid);
			oViewModel.setProperty("/request/Plstx", this._positionSelected.Stext);
			oViewModel.setProperty("/request/Stell", this._positionSelected.ObjidR3);
			oViewModel.setProperty("/request/Stetx", this._positionSelected.StextR3);
			oViewModel.setProperty("/request/Orgeh", this._positionSelected.ObjidR2);
			oViewModel.setProperty("/request/Orgtx", this._positionSelected.StextR2);

			this._positionValueHelpDialog.close();
			this._positionHelpTree.clearSelection();

		},

		onDialogClosed: function (oEvent) {
			oEvent.getSource().destroy();
		},

		onReasonChanged: function (oEvent) {
			var oViewModel = this.getModel("employeeRequestView");

			oViewModel.setProperty("/request/Nopln", false);
			oViewModel.setProperty("/request/Plaft", "");
			oViewModel.setProperty("/request/Plans", "00000000");
			oViewModel.setProperty("/request/Plstx", "");
			oViewModel.setProperty("/request/Plaft", "");
			oViewModel.setProperty("/request/Stell", "00000000");
			oViewModel.setProperty("/request/Stetx", "");
			oViewModel.setProperty("/request/Orgeh", "00000000");
			oViewModel.setProperty("/request/Orgtx", "");
		},
		onPositionOther: function (oEvent) {
			var oViewModel = this.getModel("employeeRequestView");

			oViewModel.setProperty("/request/Nopln", true);
			oViewModel.setProperty("/request/Plaft", "");
			oViewModel.setProperty("/request/Plans", "00000000");
			oViewModel.setProperty("/request/Plstx", "");
			oViewModel.setProperty("/request/Plaft", "");
			oViewModel.setProperty("/request/Stell", "00000000");
			oViewModel.setProperty("/request/Stetx", "");
			oViewModel.setProperty("/request/Orgeh", "00000000");
			oViewModel.setProperty("/request/Orgtx", "");

			this._positionValueHelpDialog.close();
			this._positionHelpTree.clearSelection();
		},
		onCancelPositionAdd: function (oEvent) {
			this._positionValueHelpDialog.close();
			if (this._positionHelpTree) {
				this._positionHelpTree.clearSelection();
				this._positionSelected = null;
			}
		},
		onOrganizationTreeToggled: function (oEvent) {
			var oViewModel = this.getModel("employeeRequestView");
			oViewModel.setProperty("/organizationHelp/enableAdd", false);
			this._organizationSelected = null;
			var oTreeOriginal = this.byId("idOrganizationTreeOriginal") || sap.ui.getCore().byId("idOrganizationTreeOriginal");
			var oTreeProxy = this.byId("idOrganizationTreeProxy") || sap.ui.getCore().byId("idOrganizationTreeProxy");
			try {
				if (oTreeOriginal) oTreeOriginal.clearSelection();
			} catch (oEx) {
				jQuery.sap.log.error("Tree clear failed");
			}
			try {
				if (oTreeProxy) oTreeProxy.clearSelection();
			} catch (oEx) {
				jQuery.sap.log.error("Tree clear failed");
			}

		},
		onOrganizationValueRequest: function (oEvent) {
			if (!this._organizationValueHelpDialog) {
				this._organizationValueHelpDialog = sap.ui.xmlfragment(
					"com.bmc.hcm.erf.fragment.OrganizationSearch",
					this
				);
				this.getView().addDependent(this._organizationValueHelpDialog);
			}
			this._organizationValueHelpDialog.open();
		},
		onOrganizationRowSelected: function (oEvent) {
			var oContext = oEvent.getParameters("rowContext");
			var oViewModel = this.getModel("employeeRequestView");

			var oOrganization = null;
			try {
				oOrganization = oViewModel.getProperty(oContext.rowContext.sPath);
				this._organizationHelpTree = oEvent.getSource();
				this._organizationSelected = null;

				if (oOrganization.Otype === "O") {
					this._organizationSelected = oOrganization;
				}

				oViewModel.setProperty("/organizationHelp/enableAdd", oOrganization.Otype === "O" ? true : false);
			} catch (oErr) {
				oOrganization = null;
				oViewModel.setProperty("/organizationHelp/enableAdd", false);
			}

		},
		onOrganizationAdd: function (oEvent) {
			var oViewModel = this.getModel("employeeRequestView");

			oViewModel.setProperty("/request/Orgeh", this._organizationSelected.Objid);
			oViewModel.setProperty("/request/Orgtx", this._organizationSelected.Stext);

			this._organizationValueHelpDialog.close();
			this._organizationHelpTree.clearSelection();

		},
		onCancelOrganizationAdd: function (oEvent) {
			this._organizationValueHelpDialog.close();
			if (this._organizationValueHelpDialog) {
				this._organizationHelpTree.clearSelection();
				this._organizationSelected = null;
			}
		},

		onJobValueRequest: function (oEvent) {
			if (!this._jobValueHelpDialog) {
				this._jobValueHelpDialog = sap.ui.xmlfragment(
					"com.bmc.hcm.erf.fragment.JobSearch",
					this
				);
				this.getView().addDependent(this._jobValueHelpDialog);
			}
			this._jobValueHelpDialog.setRememberSelections(false);
			this._jobValueHelpDialog.open();
		},
		onJobSearch: function (oEvent) {
			var sValue = oEvent.getParameter("value");
			var aFilters = [];

			aFilters.push(new Filter("Otype", FilterOperator.EQ, "C"));
			aFilters.push(new Filter("Stext", FilterOperator.EQ, sValue));

			oEvent.getSource().getBinding("items").filter(aFilters);
		},
		onJobSelect: function (oEvent) {
			var oSelectedObject = oEvent.getParameter("selectedContexts")[0].getObject();
			var oViewModel = this.getModel("employeeRequestView");

			if (oSelectedObject) {
				oViewModel.setProperty("/request/Stell", oSelectedObject.Objid);
				oViewModel.setProperty("/request/Stetx", oSelectedObject.Stext);
			}
			oEvent.getSource().getBinding("items").filter(new Filter("Otype", FilterOperator.EQ, "C"));
			oEvent.getSource().getBinding("items").refresh();
			this._jobValueHelpDialog.setRememberSelections(false);
		},

		onOpenFormActions: function (oEvent) {
			var oSource = oEvent.getSource();
			if (!this._formActions) {
				this._formActions = sap.ui.xmlfragment(
					"com.bmc.hcm.erf.fragment.FormActions",
					this
				);
				this.getView().addDependent(this._formActions);
			}
			this._formActions.openBy(oSource);
		},

		onFormActionSelected: function (oEvent) {
			var oSource = oEvent.getSource();
			var oViewModel = this.getModel("employeeRequestView");
			var oFormData = oViewModel.getProperty("/request");
			var aFormActions = oViewModel.getProperty("/formActions");
			var sButtonId = oSource.data("buttonId");
			var aButtonProp = _.filter(aFormActions, {
				"Erfbt": sButtonId
			});
			var sStatusChange = false;
			var oStatusChange = {};

			try {
				oFormData.Actio = aButtonProp[0].Erfbt;
				oFormData.ErfstN = aButtonProp[0].ErfstN;
				oFormData.ErfssN = aButtonProp[0].ErfssN;
				oViewModel.setProperty("/request", oFormData);
				if (!this._validateForm()) {
					return;
				}
				switch (aButtonProp[0].Erfbs) {
				case "S": //Save
					this._updateRequest(oFormData, this._sNewRequest, true, false, History);
					return;
				case "A": //Approve
					oStatusChange.statusChangeNoteRequired = false;
					oStatusChange.statusChangePlaceholder = this.getText("ENTER_STATUS_CHANGE_REASON");
					sStatusChange = true;
					break;
				case "B": //Back
					oStatusChange.statusChangeNoteRequired = true;
					oStatusChange.statusChangePlaceholder = this.getText("ENTER_REVISION_REASON");
					sStatusChange = true;
					break;
				case "R": //Reject
					oStatusChange.statusChangeNoteRequired = true;
					oStatusChange.statusChangePlaceholder = this.getText("ENTER_REJECTION_REASON");
					sStatusChange = true;
					break;
				default:
					return;
				}

				if (sStatusChange) {
					oStatusChange.statusChangeNote = "";
					oStatusChange.beginButtonText = aButtonProp[0].Erfbx;
					oStatusChange.beginButtonType = aButtonProp[0].Erfbs;
					oStatusChange.beginButtonIcon = aButtonProp[0].Erfbi;
					if (this._sNewRequest) {
						oStatusChange.informationNote = this.getText("NEW_EMPLOYEE_REQUEST_INFORMATION_NOTE");
					} else {
						oStatusChange.informationNote = this.getText("STATUS_CHANGE_NOTE", aButtonProp[0].ErfsyN === "" ? aButtonProp[0].ErfsxN :
							aButtonProp[0].ErfsxN + "-" + aButtonProp[0].ErfsyN);
					}

					oViewModel.setProperty("/statusChangeDialog", oStatusChange);

					if (!this._statusChangeDialog || this._statusChangeDialog.bIsDestroyed) {
						this._statusChangeDialog = sap.ui.xmlfragment(
							"com.bmc.hcm.erf.fragment.StatusChange",
							this
						);
						this.getView().addDependent(this._statusChangeDialog, this);
					}
					this._statusChangeDialog.open();
				}
			} catch (oErr) {
				jQuery.sap.log.error("Form action failed!");
			}
		},

		onStatusChangeConfirmed: function (oEvent) {
			var oViewModel = this.getModel("employeeRequestView");
			var oFormData = oViewModel.getProperty("/request");
			var oStatusChange = oViewModel.getProperty("/statusChangeDialog");

			this._statusChangeDialog.close();

			oFormData.Stcnt = oStatusChange.statusChangeNote;

			this._updateRequest(oFormData, this._sNewRequest, true, true, History);

		},
		onStatusChangeCancelled: function (oEvent) {
			this._statusChangeDialog.close();
		},
		onStatusChangeDialogClosed: function (oEvent) {
			this._statusChangeDialog.destroy();
		},
		onCreateInternalJobPosting: function (oEvent) {
			var oViewModel = this.getModel("employeeRequestView");
			var oFormData = oViewModel.getProperty("/request");

			this.getRouter().navTo("internaljobposting", {
				Erfid: oFormData.Erfid
			});
		},
		onCreateExternalJobPosting: function (oEvent) {
			var oViewModel = this.getModel("employeeRequestView");
			var oFormData = oViewModel.getProperty("/request");

			this.getRouter().navTo("externaljobposting", {
				Erfid: oFormData.Erfid
			});
		},

		onApplicantPressed: function (oEvent) {
			var oSource = oEvent.getSource();
			this._currentCandidate = oSource.data();
			if (!this._candidateActionSheet) {
				this._candidateActionSheet = sap.ui.xmlfragment(
					"com.bmc.hcm.erf.fragment.CandidateActions",
					this
				);
				this.getView().addDependent(this._candidateActionSheet);
			}

			this._candidateActionSheet.openBy(oSource);

		},
		onCandidateResume: function (oEvent) {
			var oViewModel = this.getModel("employeeRequestView");
			var sCandidatePath = null;
			try {
				sCandidatePath = oEvent.getSource().getParent().getParent().getParent().getBindingContextPath();
			} catch (oEx1) {
				try {
					sCandidatePath = oEvent.getSource().getParent().getBindingInfo("cardHeaderTitle").binding.oContext.sPath;
				} catch (oEx2) {
					jQuery.sap.log.error("Candidate not read!");
					return;
				}
			}

			var oCurrentCandidate = oViewModel.getProperty(sCandidatePath);
			var sPath = "/sap/opu/odata/sap/ZHCM_RECRUITMENT_SRV/CandidateResumeSet(Tclas='" +
				oCurrentCandidate.Tclas +
				"',Pernr='" + oCurrentCandidate.Pernr + "')/$value";
			var sTitle = this.getText("CANDIDATE_RESUME", [oCurrentCandidate.Ename,
				this.getText(oCurrentCandidate.Tclas === "A" ? "INTERNAL_APPLICANT" : "EXTERNAL_APPLICANT")
			]);

			this._callPDFViewer(sPath, sTitle);
		},

		onCandidateEdit: function (oEvent) {
			var oModel = this.getModel();
			var oViewModel = this.getModel("employeeRequestView");
			var oThis = this;
			var sCandidatePath = null;
			try {
				sCandidatePath = oEvent.getSource().getParent().getParent().getParent().getBindingContextPath();
			} catch (oEx1) {
				try {
					sCandidatePath = oEvent.getSource().getParent().getBindingInfo("cardHeaderTitle").binding.oContext.sPath;
				} catch (oEx2) {
					jQuery.sap.log.error("Candidate not read!");
					return;
				}
			}
			var oCurrentCandidate = oViewModel.getProperty(sCandidatePath);

			SharedData.setCandidateProcess({
				"Erfid": oCurrentCandidate.Erfid,
				"Tclas": oCurrentCandidate.Tclas,
				"Pernr": oCurrentCandidate.Pernr
			});

			this.getRouter().navTo("candidateprocess");
		},

		onCandidateDelete: function (oEvent) {
			var oModel = this.getModel();
			var oViewModel = this.getModel("employeeRequestView");
			var oThis = this;
			var sCandidatePath = null;
			try {
				sCandidatePath = oEvent.getSource().getParent().getParent().getParent().getBindingContextPath();
			} catch (oEx1) {
				try {
					sCandidatePath = oEvent.getSource().getParent().getBindingInfo("cardHeaderTitle").binding.oContext.sPath;
				} catch (oEx2) {
					jQuery.sap.log.error("Candidate not read!");
					return;
				}
			}
			var oCurrentCandidate = oViewModel.getProperty(sCandidatePath);

			var _doDelete = function () {
				var sPath = oModel.createKey("/CandidateProcessSet", {
					Erfid: oCurrentCandidate.Erfid,
					Tclas: oCurrentCandidate.Tclas,
					Pernr: oCurrentCandidate.Pernr
				});

				oThis._openBusyFragment("CANDIDATE_BEING_UNASSIGNED");

				oModel.remove(sPath, {
					success: function () {
						oThis._closeBusyFragment();
						oThis._callMessageToast(oThis.getText("CANDIDATE_DELETED"), "S");
						oThis._getCandidateList(oCurrentCandidate.Erfid);
					},
					error: function () {
						oThis._closeBusyFragment();
					}
				});
			};

			var oBeginButtonProp = {
				text: this.getText("UNASSIGN_CANDIDATE"),
				type: "Reject",
				icon: "sap-icon://disconnected",
				onPressed: _doDelete
			};

			var aParam = [];

			aParam[0] = oCurrentCandidate.Tclas === "A" ? this.getText("INTERNAL_APPLICANT") : this.getText("EXTERNAL_APPLICANT");
			aParam[1] = oCurrentCandidate.Ename;
			this._callConfirmDialog(this.getText("CONFIRMATION_REQUIRED"), "Message", "Warning",
				this.getText("CANDIDATE_UNASSIGN_CONFIRMATION", aParam),
				oBeginButtonProp, null).open();

		},
		onInternalCandidateAdd: function (oEvent) {
			var oRequest = SharedData.getCurrentRequest();
			var aFilters = [];
			if (!this._oInternalCandidateValueHelpDialog) {
				this._oInternalCandidateValueHelpDialog = sap.ui.xmlfragment(
					"com.bmc.hcm.erf.fragment.InternalCandidateSearch",
					this
				);
				this.getView().addDependent(this._oInternalCandidateValueHelpDialog);
			}
			aFilters.push(new Filter("Erfid", FilterOperator.EQ, oRequest.Erfid));
			this._oInternalCandidateValueHelpDialog.getBinding("items").filter(aFilters);
			this._oInternalCandidateValueHelpDialog.getBinding("items").refresh();
			this._oInternalCandidateValueHelpDialog.setRememberSelections(false);
			this._oInternalCandidateValueHelpDialog.open();
		},
		onPerformInternalCandidateSearch: function (oEvent) {
			var oRequest = SharedData.getCurrentRequest();
			var sValue = oEvent.getParameter("value");
			var aFilters = [];

			aFilters.push(new Filter("Erfid", FilterOperator.EQ, oRequest.Erfid));
			aFilters.push(new Filter("Ename", FilterOperator.EQ, sValue));

			oEvent.getSource().getBinding("items").filter(aFilters);
		},
		onConfirmInternalCandidateSelection: function (oEvent) {
			var aSelectedContext = oEvent.getParameter("selectedContexts");
			var oThis = this;
			var oModel = this.getModel();
			var oRequest = SharedData.getCurrentRequest();
			var oSelectedObject = {};

			var _doAdd = function () {
				var oCandidate = {
					"Erfid": oRequest.Erfid,
					"Tclas": "A",
					"Pernr": oSelectedObject.Pernr,
					"Actio": "ASSIGN",
					"CanstN": "001",
					"CanssN": "000"
				};
				oThis._openBusyFragment("CANDIDATE_BEING_ASSIGNED");
				oThis._oInternalCandidateValueHelpDialog.getBinding("items").filter();
				oThis._oInternalCandidateValueHelpDialog.getBinding("items").refresh();
				oThis._oInternalCandidateValueHelpDialog.setRememberSelections(false);
				oModel.create("/CandidateProcessSet", oCandidate, {
					success: function (oData, oResponse) {
						oThis._closeBusyFragment();
						oThis._callMessageToast(oThis.getText("CANDIDATE_ADDED"), "S");
						oThis._getCandidateList(oRequest.Erfid);
					},
					error: function () {
						oThis._closeBusyFragment();
					}
				});
			};

			try {
				oSelectedObject = aSelectedContext[0].getObject();
			} catch (oEx) {
				jQuery.sap.log.error(oEx);
				return;
			}

			if (oSelectedObject.Isass) {
				oThis._callMessageToast(oThis.getText("ALREADY_ADDED", [oSelectedObject.Ename]), "W");
				return;
			} else {

				var oBeginButtonProp = {
					text: this.getText("ASSIGN_CANDIDATE"),
					type: "Accept",
					icon: "sap-icon://add-employee",
					onPressed: _doAdd
				};

				this._callConfirmDialog(this.getText("CONFIRMATION_REQUIRED"), "Message", "Success", this.getText(
						"INTERNAL_CANDIDATE_ASSIGN_CONFIRMATION", [
							oSelectedObject.Ename
						]),
					oBeginButtonProp, null).open();

			}
		},
		onCancelInternalCandidateSelection: function (oEvent) {
			oEvent.getSource().getBinding("items").filter();
			oEvent.getSource().getBinding("items").refresh();
			this._oInternalCandidateValueHelpDialog
				.setRememberSelections(false);
		},
		onApplicantAdd: function (oEvent) {

			if (!this._applicantValueHelpDialog) {
				this._applicantValueHelpDialog = sap.ui.xmlfragment(
					"com.bmc.hcm.erf.fragment.CandidateSearch",
					this
				);
				this.getView().addDependent(this._applicantValueHelpDialog);
			}
			//this._applicantValueHelpDialog.setRememberSelections(false);
			var oListModel = this.getModel("candidateListModel");
			oListModel.setProperty("/CandidateActionSettings/ActionsColumnVisible", false);
			oListModel.setProperty("/CandidateActionSettings/SelectColumnVisible", true);
			this._applicantValueHelpDialog.open();
		},
		onCloseCandidateSearch: function (oEvent) {
			this._applicantValueHelpDialog.close();
		},
		onCandidateSelected: function (oEvent) {
			var oModel = this.getModel();
			var oSelectedObject = oModel.getProperty(oEvent.getSource().getBindingContext().sPath);
			var oRequest = SharedData.getCurrentRequest();
			var oThis = this;
			var oViewModel = this.getModel("employeeRequestView");
			var aPrev = oViewModel.getProperty("candidateList");

			var oExist = _.find(aPrev, {
				"Tclas": "B",
				"Pernr": oSelectedObject.Pernr
			});

			if (oExist) {
				oThis._callMessageToast(oThis.getText("ALREADY_ADDED", [oSelectedObject.Ename]), "W");
				return;
			}

			var _doAdd = function () {
				var oCandidate = {
					"Erfid": oRequest.Erfid,
					"Tclas": "B",
					"Pernr": oSelectedObject.Pernr,
					"Actio": "ASSIGN",
					"CanstN": "001",
					"CanssN": "000"
				};
				oThis._applicantValueHelpDialog.close();
				oThis._openBusyFragment("CANDIDATE_BEING_ASSIGNED");

				oModel.create("/CandidateProcessSet", oCandidate, {
					success: function (oData, oResponse) {
						oThis._closeBusyFragment();
						oThis._callMessageToast(oThis.getText("CANDIDATE_ADDED"), "S");
						oThis._getCandidateList(oRequest.Erfid);
					},
					error: function () {
						oThis._closeBusyFragment();
					}
				});

			};

			var oBeginButtonProp = {
				text: this.getText("ASSIGN_CANDIDATE"),
				type: "Accept",
				icon: "sap-icon://add-employee",
				onPressed: _doAdd
			};

			this._callConfirmDialog(this.getText("CONFIRMATION_REQUIRED"), "Message", "Success", this.getText("CANDIDATE_ASSIGN_CONFIRMATION", [
					oSelectedObject.Ename
				]),
				oBeginButtonProp, null).open();

			oEvent.getSource().getBinding("items").filter();
			oEvent.getSource().getBinding("items").refresh();
			this._applicantValueHelpDialog.setRememberSelections(false);
		},

		/* =========================================================== */
		/* internal methods                                            */
		/* =========================================================== */
		/**
		 * Initiate models
		 * @function
		 * @param {sap.ui.base.Event} oEvent pattern match event in route 'object'
		 * @private
		 */
		_initiateModels: function () {
			var oViewModel = this.getModel("employeeRequestView");

			oViewModel.setProperty("/request", null);
			oViewModel.setProperty("/formActions", []);
			oViewModel.setProperty("/formHistory", []);
			oViewModel.setProperty("/statusChangeDialog", null);
			oViewModel.setProperty("/requestOwner", null);
			oViewModel.setProperty("/positionList", null);
			oViewModel.setProperty("/organizationList", null);
			oViewModel.setProperty("/positionListProxy", null);
			oViewModel.setProperty("/organizationListProxy", null);
			oViewModel.setProperty("/usedPositionList", null);

			SharedData.setCurrentRequest(null);

			for (var sPropertyName in this._formFragments) {
				if (!this._formFragments.hasOwnProperty(sPropertyName)) {
					return;
				}

				this._formFragments[sPropertyName].destroy();
				this._formFragments[sPropertyName] = null;
			}

		},
		_checkPositionReasonConsistency: function (oPosition) {
			var oViewModel = this.getModel("employeeRequestView");
			var sErfrs = oViewModel.getProperty("/request/Erfrs");

			if (sErfrs === "1" && oPosition.OtypeR1 === "P" &&
				!(oPosition.ObjidR1 === "00000000" || oPosition.ObjidR1 === null || oPosition.ObjidR1 === undefined || oPosition.ObjidR1 === "")) {
				MessageBox.error(this.getText("SELECT_EMPTY_POSITION"));
				return false;
			} else {
				return true;
			}
		},
		/**
		 * Pattern matched
		 * @function
		 * @param {sap.ui.base.Event} oEvent pattern match event in route 'object'
		 * @private
		 */
		_onNewRequestMatched: function (oEvent) {
			this._sNewRequest = true;
			this._setChangeListeners();
			this._getRequestDefaults();
			this._getManagerHierarchy();
		},
		_onRequestMatched: function (oEvent) {
			var sErfid = oEvent.getParameter("arguments").Erfid;
			this._sErfid = sErfid;
			this._sNewRequest = false;
			this._setChangeListeners();
			this._getRequest(sErfid);
			this._getFormActions(sErfid);
			this._getFormHistory(sErfid);
			this._getManagerHierarchy();
			this._getCandidateList(sErfid);
		},
		_onCandidateListMatched: function (oEvent) {
			var oListModel = this.getModel("candidateListModel");
			oListModel.setProperty("/CandidateActionSettings/ActionsColumnVisible", true);
			oListModel.setProperty("/CandidateActionSettings/SelectColumnVisible", false);
		},
		_setChangeListeners: function () {
			var oViewModel = this.getModel("employeeRequestView");
			var oThis = this;
			var oRequestModel = new sap.ui.model.Binding(oViewModel, "/", oViewModel.getContext("/request"));
			oRequestModel.attachChange(function (oEvent) {
				oThis._clearValidationTraces();
			}, this);
			oViewModel.setProperty("/request", null);
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
		},

		_getRequest: function (sErfid) {
			var oModel = this.getModel();
			var oViewModel = this.getModel("employeeRequestView");
			var oThis = this;
			var oChangeFragment = this._getFragment("EmployeeRequestChange");
			var oDisplayFragment = this._getFragment("EmployeeRequestDisplay");
			var sPath = oModel.createKey("/EmployeeRequestFormSet", {
				Erfid: sErfid
			});
			var oRequest = SharedData.getCurrentRequest();
			var sForceRefresh = SharedData.getForceRefresh();
			var oSettings = SharedData.getApplicationSettings();
			try {
				var oFilter = this.byId("idRequestInfoFilter");
				if (oFilter) {
					oFilter.removeAllContent();
					if (oSettings.Edit || oRequest.Erfso === "H03" || oRequest.Erfso === "H06") {
						oFilter.insertContent(oChangeFragment, 0);
					} else {
						oFilter.insertContent(oDisplayFragment, 0);
					}
				}
			} catch (ex) {
				jQuery.sap.log.error("Fragment error:", ex);
			}

			if (sForceRefresh) {
				oRequest = null;
				SharedData.setForceRefresh(false);
			}
			if (oRequest) {
				oViewModel.setProperty("/request", oRequest);
				this._getManagerData();
			} else {
				oViewModel.setProperty("/busy", true);
				oModel.read(sPath, {
					method: "GET",
					success: function (oData, oResponse) {
						oViewModel.setProperty("/busy", false);
						oViewModel.setProperty("/request", oData);
						SharedData.setCurrentRequest(_.cloneDeep(oData));
						oThis._getManagerData();
						oViewModel.refresh(true);
					},
					error: function (oError) {
						oViewModel.setProperty("/busy", false);
					}
				});
			}

		},

		_getRequestDefaults: function () {
			var oModel = this.getModel();
			var oViewModel = this.getModel("employeeRequestView");
			var oRequestDefaults = oViewModel.getProperty("/requestDefaults");
			var oButton = this.byId("idFormActionsButton");

			if (oRequestDefaults) {
				oViewModel.setProperty("/request", _.cloneDeep(oRequestDefaults));
			} else {
				oViewModel.setProperty("/busy", true);
				oModel.callFunction("/GetNewEmpReqDefaults", {
					method: "GET",
					success: function (oData, oResponse) {
						oViewModel.setProperty("/busy", false);
						oViewModel.setProperty("/request", _.cloneDeep(oData));
						oViewModel.setProperty("/requestDefaults", _.cloneDeep(oData));
					},
					error: function (oError) {
						oViewModel.setProperty("/busy", false);
					}
				});
			}
			oButton.setBusy(true);
			oButton.setVisible(false);
			oViewModel.setProperty("/formActions", []);
			oModel.callFunction("/GetNewEmpReqDefaultActions", {
				method: "GET",
				success: function (oData, oResponse) {
					oButton.setBusy(false);
					if (oData.results.length > 0) {
						oButton.setVisible(true);
					}
					oViewModel.setProperty("/formActions", oData.results);
				},
				error: function (oError) {
					oButton.setBusy(false);
				}
			});
		},

		_getManagerData: function () {
			var oGenericModel = this.getModel("GenericServices");
			var oViewModel = this.getModel("employeeRequestView");
			var oSharedRequest = SharedData.getCurrentRequest();

			var sPath = oGenericModel.createKey("/EmployeeSearchSet", {
				Pernr: oSharedRequest.Rqowp
			});

			oGenericModel.read(sPath, {
				method: "GET",
				success: function (oData, oResponse) {
					oViewModel.setProperty("/requestOwner", oData);
				},
				error: function (oError) {
					oViewModel.setProperty("/requestOwner", null);
				}
			});

		},

		_getManagerHierarchy: function () {
			var oViewModel = this.getModel("employeeRequestView");
			var oPositionList = oViewModel.getProperty("/positionList");
			var oOrganizationList = oViewModel.getProperty("/organizationList");
			var oPositionListProxy = oViewModel.getProperty("/positionListProxy");
			var oOrganizationListProxy = oViewModel.getProperty("/organizationListProxy");

			if (!oPositionList) {
				this._refreshHierarchy("ZMNGOOSC", "/positionList");
			}
			if (!oOrganizationList) {
				this._refreshHierarchy("ZMNGOO", "/organizationList");
			}
			if (!oPositionListProxy) {
				this._refreshHierarchy("ZMNVOOSC", "/positionListProxy");
			}
			if (!oOrganizationListProxy) {
				this._refreshHierarchy("ZMNVOO", "/organizationListProxy");
			}
		},
		_refreshPositionUsed: function (oCallBack) {
			var oModel = this.getModel();
			var aFilters = [];
			var oRequest = SharedData.getCurrentRequest();
			var oViewModel = this.getModel("employeeRequestView");
			var oThis = this;

			if (oRequest) {
				aFilters.push(new Filter("Erfid", FilterOperator.EQ, oRequest.Erfid));
			}

			oViewModel.setProperty("/usedPositionList", []);
			this._openBusyFragment();
			oModel.read("/UsedPositionSet", {
				filters: aFilters,
				success: function (oData, oResponse) {
					oThis._closeBusyFragment();
					oViewModel.setProperty("/usedPositionList", oData.results);
					oCallBack();
				},
				error: function (oError) {
					oThis._closeBusyFragment();
				}
			});
		},
		_refreshHierarchy: function (sWegid, sPath) {
			var oGenericModel = this.getModel("GenericServices");
			var oViewModel = this.getModel("employeeRequestView");
			var oHierarchy = {
				"children": []
			};
			var oUrlParameters = {};
			var oSharedRequest = SharedData.getCurrentRequest();

			oViewModel.setProperty(sPath, oHierarchy);

			var _generateHierarchy = function (aHierarchy) {
				var aRooto = _.filter(aHierarchy, "Rooto");

				var _getChild = function (oParent) {
					var oLine = oParent;
					oLine.children = [];
					if (oLine.Otype === "O") {
						oLine.children = _.filter(aHierarchy, {
							"Loopc": oParent.Loopc,
							"Pupsq": oParent.Seqnr
						});
					}

					_.forEach(oLine.children, function (oChild) {
						if (oChild.Otype === "O") {
							_getChild(oChild);
						}
					});

					if (oParent.Rooto) {
						oHierarchy.children.push(oLine);
					}
				};

				_.forEach(aRooto, function (oRooto) {
					_getChild(oRooto);
				});
				oViewModel.setProperty(sPath, oHierarchy);

			};

			/*Get all position list or org acc to evaluation path*/
			oUrlParameters.Wegid = sWegid;

			if (oSharedRequest) {
				oUrlParameters.Mngun = oSharedRequest.Rqown;
			} else {
				oUrlParameters.Mngun = "";

			}

			oGenericModel.callFunction("/GetManagerHierarchy", {
				method: "GET",
				urlParameters: oUrlParameters,
				success: function (oData, oResponse) {
					_generateHierarchy(oData.results);
				},
				error: function (oError) {
					jQuery.sap.log.error("Manager hierarchy could not be retrieved!");
				}
			});
		},

		_validateForm: function () {
			var oValidator = new FormValidator(this);
			var oViewModel = this.getModel("employeeRequestView");
			var oFormData = oViewModel.getProperty("/request");
			var oFormToValidate = sap.ui.getCore().byId("idEmployeeRequestForm") || this.byId("idEmployeeRequestForm");

			if (!oFormData.Extja && !oFormData.Intja) {
				this._callMessageToast(this.getText("AT_LEAST_ONE_RESOURCE"), "E");
				return false;
			}

			if (oFormData.Cnted) {
				oFormData.Cnted.setHours(9);
				oViewModel.setProperty("/request", oFormData);
			}
			if (oFormToValidate) {
				var sResult = oValidator.validate(oFormToValidate);
				if (!sResult) {
					this._callMessageToast(this.getText("FORM_HAS_ERRORS"), "E");
				}
				return sResult;
			} else {
				return true;
			}
		},
		_clearValidationTraces: function () {
			var oValidator = new FormValidator(this);
			var oFormToValidate = sap.ui.getCore().byId("idEmployeeRequestForm") || this.byId("idEmployeeRequestForm");
			if (oFormToValidate) {
				oValidator.clearTraces(oFormToValidate);
			}
		},

		_getFormActions: function (sErfid) {
			var oButton = this.byId("idFormActionsButton");
			var oModel = this.getModel();
			var oViewModel = this.getModel("employeeRequestView");
			var sPath = "/EmployeeRequestFormSet('" + sErfid + "')/FormActionsSet";
			var oSettings = SharedData.getApplicationSettings();

			if (oButton) {
				oButton.setBusy(true);
				oButton.setVisible(false);
				oButton.getParent().setVisible(false);
				oViewModel.setProperty("/formActions", []);

				oModel.read(sPath, {
					method: "GET",
					success: function (oData, oResponse) {
						oButton.setBusy(false);
						var aActions = [];
						aActions = oSettings.Edit ? oData.results : _.remove(oData.results, function (oLine) {
							return oLine.Erfbs !== "S";
						});

						if (aActions.length > 0) {
							oButton.setVisible(true);
							oButton.getParent().setVisible(true);
						}

						oViewModel.setProperty("/formActions", aActions);
					},
					error: function (oError) {
						oButton.setBusy(false);
					}
				});
			}

		},

		_checkJobHigherLevel: function (sStell) {
			var aUpperLevelJobs = SharedData.getUpperLevelJobs();

			var oJob = _.find(aUpperLevelJobs, ["Objid", sStell]);

			return oJob ? true : false;
		},

		_getFormHistory: function (sErfid) {
			var oModel = this.getModel();
			var oViewModel = this.getModel("employeeRequestView");
			var sPath = "/EmployeeRequestFormSet('" + sErfid + "')/EmployeeRequestHistorySet";

			oViewModel.setProperty("/formHistory", []);

			oModel.read(sPath, {
				method: "GET",
				success: function (oData, oResponse) {
					oViewModel.setProperty("/formHistory", oData.results);
				},
				error: function (oError) {
					jQuery.sap.log.error("Form history could not be fetched");
				}
			});
		},

		onRefreshCandidate: function () {
			var oRequest = SharedData.getCurrentRequest();
			this._getCandidateList(oRequest.Erfid);
		},

		_getCandidateList: function (sErfid) {
			var aCandidates = [];
			var oGrid = this.byId("idCandidateListGrid");
			var oViewModel = this.getModel("employeeRequestView");
			var oModel = this.getModel();
			var oRequest = SharedData.getCurrentRequest();
			oViewModel.setProperty("/candidateList", []);
			oViewModel.setProperty("/candidateCount", 0);

			if (oGrid) {
				var sPath = "/EmployeeRequestFormSet('" + oRequest.Erfid + "')/CandidateProcessSet";
				oGrid.setBusy(true);
				oModel.read(sPath, {
					success: function (oData, oResponse) {
						oGrid.setBusy(false);
						aCandidates = oData.results;

						$.each(aCandidates, function (sKey, oCandidate) {
							oCandidate.chartData = [{
								data: [oCandidate.Perct, 100 - oCandidate.Perct],
								backgroundColor: oCandidate.Perct < 33 ? [
									"#ff6384",
									"#e0e0e0"
								] : oCandidate.Perct < 66 ? [
									"#e78c07",
									"#e0e0e0"
								] : [
									"#2b7d2b",
									"#e0e0e0"
								]
							}];
						});
						oViewModel.setProperty("/candidateList", aCandidates);
						oViewModel.setProperty("/candidateCount", aCandidates.length ? aCandidates.length : 0);
						//_formGrid();
					},
					error: function (oError) {
						oGrid.setBusy(false);
					}
				});
			}
			// } //if (oGrid) 
		},
		onToggleFilterBar: function () {
			var oViewModel = this.getModel("candidateListModel");
			var sExpanded = oViewModel.getProperty("/FilterBarExpanded");
			oViewModel.setProperty("/FilterBarExpanded", sExpanded ? false : true);
		},

		_getFilters: function (sExceptCplty) {
			var oViewModel = this.getModel("candidateListModel");
			var oFilter = oViewModel.getProperty("/Filters");
			var aFilters = [];
			if (!sExceptCplty) {
				if (oFilter.Cplty !== "") {
					aFilters.push(new Filter("Cplty", FilterOperator.EQ, oFilter.Cplty));
				}
			}
			if (oFilter.Ename !== "") {
				aFilters.push(new Filter("Ename", FilterOperator.EQ, oFilter.Ename));
			}
			if (oFilter.Gesch !== "") {
				aFilters.push(new Filter("Gesch", FilterOperator.EQ, oFilter.Gesch));
			}
			if (oFilter.Slart !== "") {
				aFilters.push(new Filter("Slart", FilterOperator.EQ, oFilter.Slart));
			}
			if (oFilter.Wdart !== "") {
				aFilters.push(new Filter("Wdart", FilterOperator.EQ, oFilter.Wdart));
			}
			if (oFilter.Lstcm !== "") {
				aFilters.push(new Filter("Lstcm", FilterOperator.EQ, oFilter.Lstcm));
			}
			if (oFilter.Lstps !== "") {
				aFilters.push(new Filter("Lstps", FilterOperator.EQ, oFilter.Lstps));
			}
			if (oFilter.Hscmn) {
				aFilters.push(new Filter("Hscmn", FilterOperator.EQ, oFilter.Hscmn));
			}
			if (oFilter.Hasrf) {
				aFilters.push(new Filter("Hasrf", FilterOperator.EQ, oFilter.Hasrf));
			}
			if (oFilter.Isvic) {
				aFilters.push(new Filter("Isvic", FilterOperator.EQ, oFilter.Isvic));
			}
			return aFilters;
		},
		onShowReference: function (oEvent) {
			var oSource = oEvent.getSource();
			sap.m.MessageToast.show(this.getText("REFERENCE_PERSON", oSource.data("referenceName")));
		},
		onCommentDialogClose: function () {
			this._oCandidateNotesDialog.close();
		},
		onShowCandidateComments: function (oEvent) {
			var oSource = oEvent.getSource();
			var sPernr = oSource.data("candidateNumber");
			var sEname = oSource.data("candidateName");
			var oModel = this.getModel();
			var oThis = this;
			var oViewModel = this.getModel("candidateListModel");
			var oNotesModel = this.getModel("candidateNotes");
			if (!oNotesModel) {
				oNotesModel = new JSONModel({
					Notes: []
				});
				this.setModel(oNotesModel, "CandidateNotes");
			}

			if (!this._oCandidateNotesDialog) {
				// create dialog via fragment factory
				this._oCandidateNotesDialog = sap.ui.xmlfragment("com.bmc.hcm.erf.fragment.CandidateNotesDisplay", this);
				// connect dialog to view (models, lifecycle)
				this.getView().addDependent(this._oCandidateNotesDialog);
			}

			this._oCandidateNotesDialog.setTitle(this.getText("COMMENTS_ABOUT_CANDIDATE", [sEname]));

			var aFilters = [
				new Filter("Tclaskey", FilterOperator.EQ, "B"),
				new Filter("Pernrkey", FilterOperator.EQ, sPernr)
			];
			oViewModel.setProperty("/busy", true);
			oNotesModel.setProperty("/Notes", []);
			oModel.read("/CandidateNotesSet", {
				filters: aFilters,
				success: function (oData, oResponse) {
					oViewModel.setProperty("/busy", false);
					oNotesModel.setProperty("/Notes", oData.results);
					oThis._oCandidateNotesDialog.open();
				},
				error: function (oError) {
					oViewModel.setProperty("/busy", false);
				}
			});
		},
		onApplyCandidateFilter: function () {
			var oTable = this.byId("idCandidatePoolTable");
			if (!oTable) {
				oTable = sap.ui.getCore().byId("idCandidatePoolTable");
			}
			oTable.getBinding("items").filter(this._getFilters(false), "Application");
		},
		onResetCandidateFilter: function () {
			var oViewModel = this.getModel("candidateListModel");
			oViewModel.setProperty("/Filters/Ename", "");
			oViewModel.setProperty("/Filters/Gesch", "");
			oViewModel.setProperty("/Filters/Slart", "");
			oViewModel.setProperty("/Filters/Wdart", "");
			oViewModel.setProperty("/Filters/Lstcm", "");
			oViewModel.setProperty("/Filters/Lstps", "");
			oViewModel.setProperty("/Filters/Hscmn", false);
			oViewModel.setProperty("/Filters/Hasrf", false);
			oViewModel.setProperty("/Filters/Isvic", false);

			this.onApplyCandidateFilter();
		},

		onPoolFilterSelect: function (oEvent) {
			var oViewModel = this.getModel("candidateListModel");
			var sKey = oEvent.getParameter("key");

			oViewModel.setProperty("/Filters/Cplty", sKey);

			this.onApplyCandidateFilter();

		},
		onCandidateListUpdateStarted: function (oEvent) {
			var oViewModel = this.getModel("candidateListModel");
			oViewModel.setProperty("/busy", true);
		},
		onCandidateListUpdated: function (oEvent) {
			var oViewModel = this.getModel("candidateListModel");
			var oModel = this.getModel();
			var aFilters = [];
			var oThis = this;
			var oSearchResults = oViewModel.getProperty("/SearchResults");

			oViewModel.setProperty("/busy", false);

			Object.keys(oSearchResults).forEach(function (sKey) {
				aFilters = oThis._getFilters(true);
				aFilters.push(new Filter("Cplty", FilterOperator.EQ, sKey));
				oModel.read("/CandidatePoolSet/$count", {
					filters: aFilters,
					success: function (oData, oResponse) {
						oViewModel.setProperty("/SearchResults/" + sKey, oResponse.body);
					},
					error: function (oError) {
						oViewModel.setProperty("/SearchResults/" + sKey, 0);
					}
				});

			});
		},

		onCandidateActionSheet: function (oEvent) {
			var oSource = oEvent.getSource();
			if (!this._oCandidateActionSheet) {
				this._oCandidateActionSheet = sap.ui.xmlfragment(
					"com.bmc.hcm.erf.fragment.CandidateListActions",
					this
				);
				this.getView().addDependent(this._oCandidateActionSheet);
			}
			var oLine = this.getModel().getProperty(oSource.getParent().getBindingContextPath());
			this._oCandidateActionSheet.data("CandidateLine", oLine);
			var oViewModel = this.getModel("candidateListModel");
			var oSettings = oViewModel.getProperty("/CandidateActionSettings");

			oSettings.DiscardFromPool = oLine.Cplty === "" ? false : true;
			oSettings.AssignToPotential = oLine.Cplty === "P" ? false : true;
			oSettings.AssignToRejected = oLine.Cplty === "R" ? false : true;
			oViewModel.setProperty("/CandidateActionSettings", oSettings);

			this._oCandidateActionSheet.openBy(oSource);
		},
		onCandidateListResume: function (oEvent) {
			var oLine = this._oCandidateActionSheet.data("CandidateLine");
			var sPath = "/sap/opu/odata/sap/ZHCM_RECRUITMENT_SRV/CandidateResumeSet(Tclas='B'," +
				"Pernr='" + oLine.Pernr + "')/$value";
			var sTitle = this.getText("CANDIDATE_RESUME", [oLine.Ename,
				this.getText("EXTERNAL_APPLICANT")
			]);

			this._callPDFViewer(sPath, sTitle);
		},
		onChangeCandidatePool: function (oEvent) {
			var oSource = oEvent.getSource();
			var sCplty = oSource.data("poolType");
			var oModel = this.getModel();
			var oThis = this;
			var oLine = this._oCandidateActionSheet.data("CandidateLine");

			var _assignConfirmed = function () {
				var oUrlParameters = {
					"Pernr": oLine.Pernr,
					"Cplty": sCplty
				};
				oThis._openBusyFragment(oThis.getText("POOL_ASSIGN_STARTED"));
				oModel.callFunction("/SetCandidatePool", {
					method: "POST",
					urlParameters: oUrlParameters,
					success: function (oData, oResponse) {
						oThis._closeBusyFragment();
						oThis._callMessageToast(oThis.getText("POOL_ASSIGN_SUCCESSFUL"), "S");
						oModel.refresh();
					},
					error: function (oError) {
						oThis._closeBusyFragment();
						oThis._callMessageToast(oThis.getText("POOL_ASSIGN_FAILED"), "E");
					}
				});

			};

			var oBeginButtonProp = {
				text: oSource.getText(),
				type: oSource.getType(),
				icon: oSource.getIcon(),
				onPressed: _assignConfirmed
			};

			this._callConfirmDialog(this.getText("CONFIRMATION_REQUIRED"), "Message", "Warning", this.getText("POOL_ASSIGN_CONFIRMATION"),
				oBeginButtonProp, null).open();
		},
		onCandidateListEdit: function (oEvent) {
			var oLine = this._oCandidateActionSheet.data("CandidateLine");
			var oViewModel = this.getModel("candidateListModel");
			oViewModel.setProperty("/busy", true);
			this.getRouter().navTo("candidateedit", {
				Pernr: oLine.Pernr
			});
		},
		onPressCandidate: function (oEvent) {
			var oViewModel = this.getModel("candidateListModel");
			var sPernr = oEvent.getSource().getBindingContext().getProperty("Pernr");
			oViewModel.setProperty("/busy", true);
			this.getRouter().navTo("candidateedit", {
				Pernr: sPernr
			});
		},
		onNewCandidateCreate: function (oEvent) {
			var oViewModel = this.getModel("candidateListModel");
			oViewModel.setProperty("/busy", true);
			this.getRouter().navTo("candidatecreate");
		},
		onDataExport: function (oEvent) {

			// var sPath = "/sap/opu/odata/sap/ZHCM_RECRUITMENT_SRV/CandidatePoolSet?$filter=Cplty eq 'C'&$format=xlsx";

			// sap.m.URLHelper.redirect(sPath, true);

			// return;
			var oExport = new Export({

				// Type that will be used to generate the content. Own ExportType's can be created to support other formats

				exportType: new ExportTypeCSV({
					separatorChar: ";"
				}),

				// Pass in the model created above
				models: this.getModel(),

				// binding information for the rows aggregation
				rows: {
					path: "/CandidatePoolSet"
				},

				// column definitions with column name and binding info for the content

				columns: [{
					name: "Aday Havuzu",
					template: {
						content: "{Cplty}"
					}
				}, {
					name: "Aday Numarası",
					template: {
						content: "{Pernr}"
					}
				}, {
					name: "Adayın Adı Soyadı",
					template: {
						content: "{Ename}"
					}
				}, {
					name: "Cinsiyeti",
					template: {
						content: "{Gescx}"
					}
				}, {
					name: "Doğum Tarihi",
					template: {
						content: "{ path:'Gbdat', type: 'sap.ui.model.type.Date', formatOptions:{ UTC: true, pattern: 'dd.MM.yyyy'}}"
					}
				}, {
					name: "Eğitim Durumu",
					template: {
						content: "{Slarx}"
					}
				}, {
					name: "Askerlik Durumu",
					template: {
						content: "{Wdarx}"
					}
				}, {
					name: "Telefonu",
					template: {
						content: "{Phone}"
					}
				}, {
					name: "Şirketi",
					template: {
						content: "{Lstcm}"
					}
				}, {
					name: "Görevi",
					template: {
						content: "{Lstps}"
					}
				}, {
					name: "Referans Bilgisi",
					template: {
						content: {
							parts: ["Hasrf", "Isvic", "Refnm"],
							formatter: function (sHasrf, sIsvic, sRefnm) {
								if (sHasrf) {
									return (sIsvic ? "VIP Referans," : "Normal Referans,") + sRefnm;
								} else {
									return "Hayır";
								}
							}
						}
					}
				}]
			});

			// download exported file
			oExport.saveFile("Aday_Listesi").catch(function (oError) {}).then(function () {
				oExport.destroy();
			});
		}
	});

});