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
	Export,
	ExportTypeCSV,
	ExportType,
	formatter
) {
	"use strict";

	return BaseController.extend("com.bmc.hcm.erf.controller.CandidateProcess", {

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
			var oCandidateProcessModel = new JSONModel();

			this.initOperations();
			this.getRouter().getRoute("candidateprocess").attachPatternMatched(this._onCandidateProcessMatched, this);
			this.setModel(oCandidateProcessModel, "candidateProcessModel");

			this._initiateModels();

		},
		onAfterRendering: function () {

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
			this._resetNavContainer();
		},
		onStatusChangeDialogClosed: function (oEvent) {
			this._oStatusChangeDialog.destroy();
		},
		onStatusChangeCancelled: function (oEvent) {
			this._oStatusChangeDialog.close();
			this._callMessageToast(this.getText("ACTION_CANCELLED"), "W");
		},
		onStatusChangeConfirmed: function (oEvent) {
			var oCallBack = this._oStatusChangeDialog.data("callBackFunction");

			if (typeof oCallBack === "function") {
				oCallBack();
			}
			this._oStatusChangeDialog.data("callBackFunction", null);
			this._oStatusChangeDialog.close();
		},
		onCandidateOfferRejectionClosed: function (oEvent) {
			this._oCandidateOfferRejectionDialog.destroy();
		},
		onCandidateOfferRejectionCancelled: function (oEvent) {
			this._oCandidateOfferRejectionDialog.close();
			this._callMessageToast(this.getText("ACTION_CANCELLED"), "W");
		},
		onCandidateOfferRejectionConfirmed: function (oEvent) {
			var oCallBack = this._oCandidateOfferRejectionDialog.data("callBackFunction");

			if (typeof oCallBack === "function") {
				oCallBack();
			}

			this._oCandidateOfferRejectionDialog.data("callBackFunction", null);
			this._oCandidateOfferRejectionDialog.close();
		},
		onProcessActionConfirmed: function (oEvent) {
			var oSource = oEvent.getSource();
			var sButtonId = oSource.data("buttonId");
			var oViewModel = this.getModel("candidateProcessModel");
			var aActions = oViewModel.getProperty("/CandidateActions");
			var oAction = _.find(aActions, ["Erfbt", sButtonId]);
			var oProcess = oViewModel.getProperty("/CandidateProcess");
			var oThis = this;
			var oStatusChange = {};
			var sStatusChange = false;
			var sSave = false;
			var aSavedExams = oViewModel.getProperty("/CandidateRequestExamSavedSet");

			var _doAction = function () {

				oProcess.Actio = sButtonId;

				if (oStatusChange.CandidateOfferRejection) {
					oProcess.Cporr = oViewModel.getProperty("/OfferRejectionDialogProperties/Reason");
					oProcess.Stcnt = oViewModel.getProperty("/OfferRejectionDialogProperties/Explanation");
				} else {
					oProcess.Stcnt = oViewModel.getProperty("/StatusChangeDialogProperties/StatusChangeNote");
					oProcess.Cpprr = oViewModel.getProperty("/StatusChangeDialogProperties/CandidateRejectionReason");
					oProcess.Cplty = oViewModel.getProperty("/StatusChangeDialogProperties/CandidatePool");
				}

				var oCallBack = null;
				switch (sButtonId) {
				case "CP_OFF_SAV":
					oCallBack = jQuery.proxy(oThis.onJobOfferFormPrintOut, oThis);
					break;
				case "CP_USF_SAV":
					oCallBack = jQuery.proxy(oThis.onUserFormPrintOut, oThis);
					break;
				default:
				}

				oThis.onProcessOperation(oProcess, sButtonId, sSave, oCallBack);
			};

			if (!oAction) {
				jQuery.sap.log.error("Action is invalid!");
				return;
			}
			oProcess.CanstN = oAction.CanstN;
			oProcess.CanssN = oAction.CanssN;

			if (oProcess.Canst !== oProcess.CanstN || oProcess.Canss !== oProcess.CanssN) {
				sStatusChange = true;
			}
			switch (oAction.Erfbs) {
			case "A": //Approve
				oStatusChange.DialogState = "Warning";
				oStatusChange.StatusChangeNoteRequired = false;
				oStatusChange.StatusChangePlaceholder = this.getText("ENTER_STATUS_CHANGE_REASON");
				oStatusChange.CandidateOfferRejection = false;
				break;
			case "R": //Reject
				oStatusChange.DialogState = "Error";
				oStatusChange.StatusChangeNoteRequired = true;
				oStatusChange.StatusChangePlaceholder = this.getText("ENTER_REJECTION_REASON");

				if (sButtonId === "CP_OFF_REJ") {
					oStatusChange.CandidateOfferRejection = true;
				} else {
					oStatusChange.CandidateOfferRejection = false;
				}
				break;
			case "B": //Revision
				oStatusChange.DialogState = "Warning";
				oStatusChange.StatusChangeNoteRequired = true;
				oStatusChange.StatusChangePlaceholder = this.getText("ENTER_REVISION_REASON");
				oStatusChange.CandidateOfferRejection = false;
				break;
			case "S": //Save
				if (!sStatusChange) {
					sSave = true;
				}
				break;
			default:
				return;
			}
			var _doContinue = function () {
				if (sStatusChange) {
					if (oStatusChange.CandidateOfferRejection) {
						var oRejectionDialogProperties = {
							Reason: "",
							Explanation: ""
						};
						oViewModel.setProperty("/OfferRejectionDialogProperties", oRejectionDialogProperties);
						if (!oThis._oCandidateOfferRejectionDialog || oThis._oCandidateOfferRejectionDialog.bIsDestroyed) {
							oThis._oCandidateOfferRejectionDialog = sap.ui.xmlfragment(
								"com.bmc.hcm.erf.fragment.CandidateOfferRejection",
								oThis
							);
							oThis.getView().addDependent(oThis._oCandidateOfferRejectionDialog, oThis);
						}
						oThis._oCandidateOfferRejectionDialog.data("callBackFunction", _doAction);
						oThis._oCandidateOfferRejectionDialog.open();
					} else {
						if (sButtonId === "CP_REJ_PRC") {
							oStatusChange.ReasonVisible = true;
						} else {
							oStatusChange.ReasonVisible = false;
						}
						oStatusChange.StatusChangeNote = "";
						oStatusChange.BeginButtonText = oAction.Erfbx;
						oStatusChange.BeginButtonType = oAction.Erfbs;
						oStatusChange.BeginButtonIcon = oAction.Erfbi;
						oStatusChange.InformationNote = oThis.getText("CANDIDATE_STATUS_CHANGE_NOTE", [oAction.CansyN === "" ? oAction.CansxN :
							oAction.CansxN + "-" + oAction.CansyN
						]);

						oViewModel.setProperty("/StatusChangeDialogProperties", oStatusChange);

						if (!oThis._oStatusChangeDialog || oThis._oStatusChangeDialog.bIsDestroyed) {
							oThis._oStatusChangeDialog = sap.ui.xmlfragment(
								"com.bmc.hcm.erf.fragment.ConfirmCandidateStatusChange",
								oThis
							);
							oThis.getView().addDependent(oThis._oStatusChangeDialog, oThis);
						}
						oThis._oStatusChangeDialog.data("callBackFunction", _doAction);
						oThis._oStatusChangeDialog.open();
					}
				} else {
					_doAction();
				}
			};

			if (this.onCheckEmailExistence(oProcess)) {
				if (oProcess.Prfso === "H01" && oAction.CansfN === "CAP" && aSavedExams.length === 0) {
					var oBeginButtonProp = {
						text: this.getText("CONTINUE_ACTION"),
						type: "Accept",
						icon: "sap-icon://accept",
						onPressed: _doContinue
					};
					this._callConfirmDialog(this.getText("CONFIRMATION_REQUIRED"), "Message", "Warning", this.getText("NO_EXAM_RESULTS_CONFIRMATION"),
						oBeginButtonProp, null).open();
				} else {
					_doContinue();
				}
			}

		},
		onIndependentAction: function (oEvent) {
			var oSource = oEvent.getSource();
			var sButtonId = oSource.data("buttonId");
			var oViewModel = this.getModel("candidateProcessModel");
			var oProcess = oViewModel.getProperty("/CandidateProcess");
			var sSave = true;
			var oCallBack = null;

			if (this.onCheckEmailExistence(oProcess)) {
				this.onProcessOperation(oProcess, sButtonId, sSave, oCallBack);
			}
		},
		_resetNavContainer: function (oEvent) {
			var oNC = this.byId("idPageNavigationContainer");

			$.each(oNC.getPages(), function (sKey, oPage) {
				if (!oPage.data("defaultPage")) {
					oNC.removePage(oPage);
				}
			});
		},
		onNavContainerBack: function (oEvent) {
			var oNC = this.byId("idPageNavigationContainer");
			oNC.back();

			this._resetNavContainer();
		},
		onCheckEmailExistence: function (oProcess) {
			if (oProcess.Email === "" || !oProcess.Email) {
				if (!this._oCandidateEmailDialog || (this._oCandidateEmailDialog ? !this._oCandidateEmailDialog.isOpen() : true)) {
					this.onCandidateEmailDialog();
				}
				this._callMessageToast(this.getText("ENTER_AN_EMAIL_ADDRESS"), "E");
				return false;
			}

			if (!this._validateEmail(oProcess.Email)) {
				this._callMessageToast(this.getText("ENTER_A_VALID_EMAIL_ADDRESS"), "E");
				return false;
			}

			return true;
		},
		onProcessOperation: function (oProcess, sButtonId, sSave, fCallBack) {
			var oModel = this.getModel();
			var sProcess = SharedData.getCandidateProcess();
			var oViewModel = this.getModel("candidateProcessModel");
			var oEmployeeRequestForm = oViewModel.getProperty("/EmployeeRequestForm");
			var oWageInfo = oViewModel.getProperty("/CandidateWage");
			var aCandidateReferenceCheck = oViewModel.getProperty("/CandidateReferenceCheck");
			var oInterviewPlan = oViewModel.getProperty("/CandidateInterviewPlan");
			var oInterviewOperation = oViewModel.getProperty("/CandidateInterviewOperation");
			var oJobOffer = oViewModel.getProperty("/CandidateJobOffer");
			var oUserForm = oViewModel.getProperty("/CandidateUserForm");
			var aExams = oViewModel.getProperty("/CandidateRequestExamSet");
			var oThis = this;
			var oReturn = {};

			var oProcessOperation = {
				Erfid: sProcess.Erfid,
				Tclas: sProcess.Tclas,
				Pernr: sProcess.Pernr,
				Actio: sButtonId,
				CandidateProcess: oProcess,
				EmployeeRequestForm: oEmployeeRequestForm,
				CandidateWage: oWageInfo,
				CandidateReferenceCheckSet: aCandidateReferenceCheck,
				CandidateJobOffer: oJobOffer,
				CandidateUserForm: oUserForm,
				CandidateRequestExamSet: aExams,
				ReturnMessage: oReturn
			};

			if (oViewModel.getProperty("/InterviewPlanned")) {
				//Copy all plan data to operation deep structure
				oInterviewOperation = this._setInterviewOperation(oInterviewOperation, oInterviewPlan);
				oProcessOperation.CandidateInterviewOperation = oInterviewOperation;
			}

			this._openBusyFragment();
			oModel.create("/CandidateProcessOperationsSet", oProcessOperation, {
				success: function (oData, oResponse) {
					oThis._closeBusyFragment();
					if (oData.ReturnMessage.Type === "E") {
						jQuery.sap.log.error("Error detail:", oData.ReturnMessage.Message);
						oThis._callMessageToast(oThis.getText("ERROR_OCCURED", [oData.ReturnMessage.Message]), "E");
					} else {
						if (!sSave) {
							oThis._callMessageToast(oThis.getText("FORM_STATUS_CHANGE_SUCCESSFUL"), "S");
							oThis.onNavBack();
						} else {
							if (oProcessOperation.Actio === "CP_UPD_EXM") {
								oThis._setExamData();
							}
							oThis._callMessageToast(oThis.getText("SAVE_SUCCESSFUL"), "S");
							if (fCallBack) {
								fCallBack.call();
							}
						}

					}

				},
				error: function (oError) {
					oThis._closeBusyFragment();
				}
			});
		},
		onCandidateEmailDialog: function (oEvent) {
			if (!this._oCandidateEmailDialog) {
				this._oCandidateEmailDialog = sap.ui.xmlfragment(
					"com.bmc.hcm.erf.fragment.CandidateUpdateEmail",
					this
				);
				this.getView().addDependent(this._oCandidateEmailDialog);
			}
			this._oCandidateEmailDialog.open();

		},
		_validateEmail: function (sEmail) {
			var sRE =
				/^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
			return sRE.test(sEmail);
		},
		onCandidateUpdateEmailSave: function () {
			var oModel = this.getModel();
			var sProcess = SharedData.getCandidateProcess();
			var oViewModel = this.getModel("candidateProcessModel");
			var oProcess = oViewModel.getProperty("/CandidateProcess");
			var oThis = this;

			if (oProcess.Email === "" || !oProcess.Email) {
				this._callMessageToast(this.getText("ENTER_AN_EMAIL_ADDRESS"), "E");
				return;
			}

			if (!this._validateEmail(oProcess.Email)) {
				this._callMessageToast(this.getText("ENTER_A_VALID_EMAIL_ADDRESS"), "E");
				return;
			}

			var oProcessOperation = {
				Erfid: sProcess.Erfid,
				Tclas: sProcess.Tclas,
				Pernr: sProcess.Pernr,
				Actio: "CP_UPD_EMA",
				CandidateProcess: oProcess
			};
			this._oCandidateEmailDialog.close();
			this._openBusyFragment("EMAIL_ADDRESS_BEING_UPDATED");
			oModel.create("/CandidateProcessOperationsSet", oProcessOperation, {
				success: function (oData, oResponse) {
					oThis._closeBusyFragment();
					if (oData.ReturnMessage.Type === "E") {
						jQuery.sap.log.error("Error detail:", oData.ReturnMessage.Message);
						oThis._callMessageToast(oThis.getText("ERROR_OCCURED", [oData.ReturnMessage.Message]), "E");
					} else {
						oThis._callMessageToast(oThis.getText("EMAIL_ADDRESS_UPDATED"), "S");
						var oSidebarData = oViewModel.getProperty("/SidebarData");
						oSidebarData.candidateInfo.Line3 = oProcess.Email;
						oViewModel.setProperty("/SidebarData", oSidebarData);
						oViewModel.refresh(true);
					}

				},
				error: function (oError) {
					oThis._closeBusyFragment();
				}
			});

		},
		onCandidateUpdateEmailCancel: function () {
			this._oCandidateEmailDialog.close();
		},
		_setInterviewOperation: function (oInterviewOperation, oInterviewPlan) {
			var sPernr;
			var sEname;
			//Copy all plan data to operation deep structure
			_.extend(oInterviewOperation, _.pick(oInterviewPlan, _.keys(oInterviewOperation)));

			//Assign Participants
			for (var i = 0; i < 3; i++) {
				sPernr = "Inp0" + (i + 1) + "Hr";
				sEname = "Inp0" + (i + 1) + "nHr";
				oInterviewOperation[sPernr] = oInterviewPlan.ParticipantsHr[i] ? oInterviewPlan.ParticipantsHr[i].Inper : null;
				oInterviewOperation[sEname] = oInterviewPlan.ParticipantsHr[i] ? oInterviewPlan.ParticipantsHr[i].Inpnm : null;
			}

			if (!oInterviewPlan.PlanDp && !oInterviewPlan.Inttg) {
				oInterviewPlan.ParticipantsDp = [];
			}
			for (var j = 0; j < 3; j++) {
				sPernr = "Inp0" + (j + 1) + "Dp";
				sEname = "Inp0" + (j + 1) + "nDp";
				oInterviewOperation[sPernr] = oInterviewPlan.ParticipantsDp[j] ? oInterviewPlan.ParticipantsDp[j].Inper : null;
				oInterviewOperation[sEname] = oInterviewPlan.ParticipantsDp[j] ? oInterviewPlan.ParticipantsDp[j].Inpnm : null;
			}

			if (oInterviewPlan.PlanHr && oInterviewPlan.Inttg) {
				oInterviewOperation.IntdtDp = oInterviewOperation.IntdtHr;
				oInterviewOperation.InttmDp = oInterviewOperation.InttmHr;
			} else if (!oInterviewPlan.PlanDp) {
				oInterviewOperation.IntdtDp = null;
				oInterviewOperation.InttmDp = null;
			}
			oInterviewOperation.CandidateTravelFormSet = [];
			if (oInterviewPlan.Inttg) {
				if (oInterviewPlan.TraexHr &&
					oInterviewPlan.CandidateTravelFormHr.Plcar !== "" &&
					oInterviewPlan.CandidateTravelFormHr.Plcar !== null) {
					oInterviewOperation.CandidateTravelFormSet.push(oInterviewPlan.CandidateTravelFormHr);
					oInterviewPlan.CandidateTravelFormDp = _.clone(oInterviewPlan.CandidateTravelFormHr);
					oInterviewPlan.CandidateTravelFormDp.Intgu = oInterviewPlan.IntguDp;
				}
			} else {
				if (oInterviewPlan.TraexHr && oInterviewPlan.CandidateTravelFormHr.Plcar !== "" &&
					oInterviewPlan.CandidateTravelFormHr.Plcar !== null) {
					oInterviewOperation.CandidateTravelFormSet.push(oInterviewPlan.CandidateTravelFormHr);
				}
				if (oInterviewPlan.TraexDp && oInterviewPlan.CandidateTravelFormDp.Plcar !== "" &&
					oInterviewPlan.CandidateTravelFormDp.Plcar !== null) {
					oInterviewOperation.CandidateTravelFormSet.push(oInterviewPlan.CandidateTravelFormDp);
				}
			}

			oInterviewOperation.CandidateTransferFormSet = [];
			if (oInterviewPlan.Inttg) {
				if (oInterviewPlan.TrnexHr && oInterviewPlan.CandidateTransferFormHr.Plcar !== "" &&
					oInterviewPlan.CandidateTransferFormHr.Plcar !== null) {
					oInterviewOperation.CandidateTransferFormSet.push(oInterviewPlan.CandidateTransferFormHr);
					oInterviewPlan.CandidateTransferFormDp = _.clone(oInterviewPlan.CandidateTransferFormHr);
					oInterviewPlan.CandidateTransferFormDp.Intgu = oInterviewPlan.IntguDp;
				}
			} else {
				if (oInterviewPlan.TrnexHr && oInterviewPlan.CandidateTransferFormHr.Plcar !== "" &&
					oInterviewPlan.CandidateTransferFormHr.Plcar !== null) {
					oInterviewOperation.CandidateTransferFormSet.push(oInterviewPlan.CandidateTransferFormHr);
				}
				if (oInterviewPlan.TrnexDp && oInterviewPlan.CandidateTransferFormDp.Plcar !== "" &&
					oInterviewPlan.CandidateTransferFormDp.Plcar !== null) {
					oInterviewOperation.CandidateTransferFormSet.push(oInterviewPlan.CandidateTransferFormDp);
				}
			}
			return oInterviewOperation;
		},
		// onPlanInterview: function (oProcess, sButtonId, sSave) {
		// 	var oModel = this.getModel();
		// 	var sProcess = SharedData.getCandidateProcess();
		// 	var oViewModel = this.getModel("candidateProcessModel");
		// 	var oInterviewPlan = oViewModel.getProperty("/CandidateInterviewPlan");
		// 	var oInterviewOperation = oViewModel.getProperty("/CandidateInterviewOperation");
		// 	var oThis = this;

		// 	oInterviewOperation = this._setInterviewOperation(oInterviewOperation, oInterviewPlan);

		// 	var oProcessOperation = {
		// 		Erfid: sProcess.Erfid,
		// 		Tclas: sProcess.Tclas,
		// 		Pernr: sProcess.Pernr,
		// 		Actio: sButtonId,
		// 		CandidateProcess: oProcess,
		// 		CandidateInterviewOperation: oInterviewOperation
		// 	};

		// 	this._openBusyFragment();
		// 	oModel.create("/CandidateProcessOperationsSet", oProcessOperation, {
		// 		success: function (oData, oResponse) {
		// 			oThis._closeBusyFragment();
		// 			if (oResponse["headers"]["message"]) {
		// 				oThis._callMessageToast(oThis.getText("ERROR_OCCURED", [oResponse["headers"]["message"]]), "E");
		// 			} else {
		// 				if (!sSave) {
		// 					oThis._callMessageToast(oThis.getText("INTERVIEW_FORM_SAVED"), "S");
		// 					oThis.onNavBack();
		// 				} else {
		// 					oThis._callMessageToast(oThis.getText("SAVE_SUCCESSFUL"), "S");
		// 				}
		// 			}
		// 		},
		// 		error: function (oError) {
		// 			oThis._closeBusyFragment();
		// 		}
		// 	});

		// },
		onPlanTravelTransfer: function (oEvent) {
			var oViewModel = this.getModel("candidateProcessModel");
			var sTargetField = oEvent.getSource().data("targetField");
			var sProcess = SharedData.getCandidateProcess();
			var oPlan = oViewModel.getProperty("/CandidateInterviewPlan");
			var sFormName = "";

			oViewModel.setProperty("/CandidateInterviewPlan/" + sTargetField, true);

			var oForm = {
				Erfid: sProcess.Erfid,
				Inpft: null,
				Intgu: null,
				Plcar: "",
				Cnard: null,
				Cnart: null,
				Plcdp: "",
				Plard: null,
				Plart: null
			};

			switch (sTargetField) {
			case "TraexHr":
				oForm.Inpft = "F";
				oForm.Cnard = oPlan.IntdtHr;
				oForm.Plard = oPlan.IntdtHr;
				oForm.Intgu = oPlan.IntguHr;
				sFormName = "CandidateTravelFormHr";
				break;
			case "TrnexHr":
				oForm.Inpft = "T";
				oForm.Cnard = oPlan.IntdtHr;
				oForm.Plard = oPlan.IntdtHr;
				oForm.Intgu = oPlan.IntguHr;
				sFormName = "CandidateTransferFormHr";
				break;
			case "TraexDp":
				oForm.Inpft = "F";
				oForm.Cnard = oPlan.IntdtDp;
				oForm.Plard = oPlan.IntdtDp;
				oForm.Intgu = oPlan.IntguDp;
				sFormName = "CandidateTravelFormDp";
				break;
			case "TrnexDp":
				oForm.Inpft = "T";
				oForm.Cnard = oPlan.IntdtDp;
				oForm.Plard = oPlan.IntdtDp;
				oForm.Intgu = oPlan.IntguDp;
				sFormName = "CandidateTravelFormHr";
				break;
			default:
			}
			oViewModel.setProperty("/CandidateInterviewPlan/" + sFormName, oForm);

		},
		onCancelTravelTransfer: function (oEvent) {
			var oViewModel = this.getModel("candidateProcessModel");
			var sTargetField = oEvent.getSource().data("targetField");
			var sFormName = "";

			oViewModel.setProperty("/CandidateInterviewPlan/" + sTargetField, false);

			var oForm = {
				Erfid: null,
				Inpft: null,
				Intgu: null,
				Plcar: "",
				Cnard: null,
				Cnart: null,
				Plcdp: "",
				Plard: null,
				Plart: null
			};

			switch (sTargetField) {
			case "TraexHr":
				oForm.Inpft = "F";
				sFormName = "CandidateTravelFormHr";
				break;
			case "TrnexHr":
				oForm.Inpft = "T";
				sFormName = "CandidateTransferFormHr";
				break;
			case "TraexDp":
				oForm.Inpft = "F";
				sFormName = "CandidateTravelFormDp";
				break;
			case "TrnexDp":
				oForm.Inpft = "T";
				sFormName = "CandidateTravelFormHr";
				break;
			default:
			}
			oViewModel.setProperty("/CandidateInterviewPlan/" + sFormName, oForm);
		},
		onResetEmployee: function (oEvent) {
			var oViewModel = this.getModel("candidateProcessModel");
			var sSourceField = oEvent.getSource().data("sourceField");
			var sTextField = "";
			var sPath = "";

			switch (sSourceField) {
			case "IntvwHr":
				sTextField = "IntvnHr";
				sPath = "/CandidateInterviewPlan/";
				break;
			case "IntvwDp":
				sTextField = "IntvnDp";
				sPath = "/CandidateInterviewPlan/";
				break;
			case "Rfint":
				sTextField = "Rfinx";
				sPath = "/CandidateReferenceCheckEdit/";
				break;
			default:
				jQuery.sap.log.error("Source field not supplied!");
				return;
			}

			oViewModel.setProperty(sPath + sSourceField, "00000000");
			oViewModel.setProperty(sPath + sTextField, "");
		},
		onDeleteParticipant: function (oEvent) {
			var oSource = oEvent.getSource();
			var sPernr = oSource.data("referencePernr");
			var sPath = oSource.data("sourcePath");
			var oViewModel = this.getModel("candidateProcessModel");
			var aParticipants = oViewModel.getProperty(sPath);

			_.remove(aParticipants, ["Inper", sPernr]);

			oViewModel.setProperty(sPath, aParticipants);
			oViewModel.refresh(true);
		},
		onAddNewParticipant: function (oEvent) {
			var sTargetPath = oEvent.getSource().data("targetPath");
			var sSourceField = "Participants";
			if (!this._employeeValueHelpDialog) {
				this._employeeValueHelpDialog = sap.ui.xmlfragment(
					"com.bmc.hcm.erf.fragment.EmployeeSearch",
					this
				);
				this.getView().addDependent(this._employeeValueHelpDialog);
			}
			this._employeeValueHelpDialog.setRememberSelections(false);
			this._employeeValueHelpDialog.data("sourceField", sSourceField);
			this._employeeValueHelpDialog.data("targetPath", sTargetPath);
			this._employeeValueHelpDialog.open();
		},

		onEmployeeValueRequest: function (oEvent) {
			var sSourceField = oEvent.getSource().data("sourceField");
			if (!this._employeeValueHelpDialog) {
				this._employeeValueHelpDialog = sap.ui.xmlfragment(
					"com.bmc.hcm.erf.fragment.EmployeeSearch",
					this
				);
				this.getView().addDependent(this._employeeValueHelpDialog);
			}
			this._employeeValueHelpDialog.setRememberSelections(false);
			this._employeeValueHelpDialog.data("sourceField", sSourceField);
			this._employeeValueHelpDialog.data("targetPath", null);
			this._employeeValueHelpDialog.open();
		},
		onEmployeeSearch: function (oEvent) {
			var sValue = oEvent.getParameter("value");
			var aFilters = [];

			aFilters.push(new Filter("Ename", FilterOperator.EQ, sValue));

			oEvent.getSource().getBinding("items").filter(aFilters);
		},
		onEmployeeSelect: function (oEvent) {
			var oSelectedObject = oEvent.getParameter("selectedContexts")[0].getObject();
			var oViewModel = this.getModel("candidateProcessModel");
			var sSourceField = this._employeeValueHelpDialog.data("sourceField");
			var sTargetPath = this._employeeValueHelpDialog.data("targetPath");
			var sTextField = "";
			var sPath = "";

			if (oSelectedObject) {
				switch (sSourceField) {
				case "IntvwHr":
					sTextField = "IntvnHr";
					sPath = "/CandidateInterviewPlan/";
					break;
				case "IntvwDp":
					sTextField = "IntvnDp";
					sPath = "/CandidateInterviewPlan/";
					break;
				case "Rfint":
					sTextField = "Rfinx";
					sPath = "/CandidateReferenceCheckEdit/";
					break;
				case "Participants":
					break;
				default:
					jQuery.sap.log.error("Source field not supplied!");
					return;
				}
				if (sTargetPath) {
					var aParticipants = oViewModel.getProperty(sTargetPath);
					var aQuery = _.find(aParticipants, ["Inper", oSelectedObject.Pernr]);
					if (!aQuery) {
						aParticipants.push({
							Inper: oSelectedObject.Pernr,
							Inpnm: oSelectedObject.Ename
						});
						this._callMessageToast(this.getText("PARTICIPANT_ADDED", [oSelectedObject.Ename]), "S");
					} else {
						this._callMessageToast(this.getText("PARTICIPANT_ALREADY_ADDED", [oSelectedObject.Ename]), "W");
					}
					oViewModel.setProperty(sTargetPath, aParticipants);
					oViewModel.refresh(true);
				} else {
					oViewModel.setProperty(sPath + sSourceField, oSelectedObject.Pernr);
					oViewModel.setProperty(sPath + sTextField, oSelectedObject.Ename);
				}
			}

			oEvent.getSource().getBinding("items").filter([]);
			oEvent.getSource().getBinding("items").refresh();
			this._employeeValueHelpDialog.setRememberSelections(false);
			this._employeeValueHelpDialog.data("sourceField", null);
		},

		onNewReferenceCheck: function () {
			var oViewModel = this.getModel("candidateProcessModel");
			var sProcess = SharedData.getCandidateProcess();
			var oReferenceEdit = {
				Erfid: sProcess.Erfid,
				Tclas: sProcess.Tclas,
				Pernr: sProcess.Pernr,
				Begda: new Date(),
				Rfint: SharedData.getCurrentUser().Pernr,
				Rfinx: SharedData.getCurrentUser().Ename,
				Refid: this.createGUID(),
				Refnm: "",
				Refcm: "",
				Repos: "",
				CandidateReferenceQuestionsSet: _.cloneDeep(oViewModel.getProperty("/CandidateReferenceQuestions"))
			};

			$.each(oReferenceEdit.CandidateReferenceQuestionsSet, function (sKey, oLine) {
				oLine.Answr = "";
			});

			oViewModel.setProperty("/CandidateReferenceCheckEdit", oReferenceEdit);

			if (!this._editReferenceCheckDialog) {
				// create dialog via fragment factory
				this._editReferenceCheckDialog = sap.ui.xmlfragment("com.bmc.hcm.erf.fragment.NewEditCandidateReferenceCheck", this);
				// connect dialog to view (models, lifecycle)
				this.getView().addDependent(this._editReferenceCheckDialog);
			}

			this._editReferenceCheckDialog.open();
		},
		onEditReferenceCheck: function (oEvent) {
			var oViewModel = this.getModel("candidateProcessModel");
			var oSource = oEvent.getSource().getParent().getParent();
			var oReferenceEdit = oViewModel.getProperty(oSource.getBindingContextPath());

			oViewModel.setProperty("/CandidateReferenceCheckEdit", oReferenceEdit);

			if (!this._editReferenceCheckDialog) {
				// create dialog via fragment factory
				this._editReferenceCheckDialog = sap.ui.xmlfragment("com.bmc.hcm.erf.fragment.NewEditCandidateReferenceCheck", this);
				// connect dialog to view (models, lifecycle)
				this.getView().addDependent(this._editReferenceCheckDialog);
			}

			this._editReferenceCheckDialog.open();
		},
		onDeleteReferenceCheck: function (oEvent) {
			var oViewModel = this.getModel("candidateProcessModel");
			var oSource = oEvent.getSource().getParent().getParent();
			var oReference = oViewModel.getProperty(oSource.getBindingContextPath());
			var aReferences = oViewModel.getProperty("/CandidateReferenceCheck");
			var sIndex = _.findIndex(aReferences, ["Refid", oReference.Refid]);
			if (sIndex !== -1) {
				aReferences.splice(sIndex, 1);
				oViewModel.setProperty("/CandidateReferenceCheck", aReferences);
			}
		},
		onSaveReferenceCheck: function () {
			var oViewModel = this.getModel("candidateProcessModel");
			var aReferences = oViewModel.getProperty("/CandidateReferenceCheck");
			var oReference = oViewModel.getProperty("/CandidateReferenceCheckEdit");
			var sIndex = _.findIndex(aReferences, ["Refid", oReference.Refid]);
			if (sIndex !== -1) {
				aReferences[sIndex] = oReference;
			} else {
				aReferences.push(oReference);
			}
			oViewModel.setProperty("/CandidateReferenceCheck", aReferences);
			this._editReferenceCheckDialog.close();
		},
		onCancelEditReferenceCheck: function () {
			this._editReferenceCheckDialog.close();
		},
		onNewRequestExam: function () {
			var oViewModel = this.getModel("candidateProcessModel");
			var sProcess = SharedData.getCandidateProcess();
			var oExamEdit = {
				Erfid: sProcess.Erfid,
				Tclas: sProcess.Tclas,
				Pernr: sProcess.Pernr,
				Exmgu: this.createGUID(),
				Exmid: "",
				Exmnm: "",
				Excor: "",
				Exrem: "",
				Exres: "",
				Exscl: "",
				Exdat: ""
			};

			oViewModel.setProperty("/CandidateRequestExamEdit", oExamEdit);

			if (!this._editRequestExamDialog) {
				// create dialog via fragment factory
				this._editRequestExamDialog = sap.ui.xmlfragment("com.bmc.hcm.erf.fragment.NewEditCandidateRequestExam", this);
				// connect dialog to view (models, lifecycle)
				this.getView().addDependent(this._editRequestExamDialog);
			}

			this._editRequestExamDialog.open();

		},
		onEditRequestExam: function (oEvent) {
			var oViewModel = this.getModel("candidateProcessModel");
			var oSource = oEvent.getSource().getParent().getParent();
			var oReferenceEdit = oViewModel.getProperty(oSource.getBindingContextPath());

			oViewModel.setProperty("/CandidateRequestExamEdit", oReferenceEdit);

			if (!this._editRequestExamDialog) {
				// create dialog via fragment factory
				this._editRequestExamDialog = sap.ui.xmlfragment("com.bmc.hcm.erf.fragment.NewEditCandidateRequestExam", this);
				// connect dialog to view (models, lifecycle)
				this.getView().addDependent(this._editRequestExamDialog);
			}

			this._editRequestExamDialog.open();
		},
		onDeleteRequestExam: function (oEvent) {
			var oViewModel = this.getModel("candidateProcessModel");
			var oSource = oEvent.getSource().getParent().getParent();
			var oExam = oViewModel.getProperty(oSource.getBindingContextPath());
			var aExams = oViewModel.getProperty("/CandidateRequestExamSet");
			var sIndex = _.findIndex(aExams, ["Exmgu", oExam.Exmgu]);
			if (sIndex !== -1) {
				aExams.splice(sIndex, 1);
				oViewModel.setProperty("/CandidateRequestExamSet", aExams);
				this._callMessageToast(this.getText("SAVE_FOR_CHANGES"), "W");
			}
		},
		onSaveRequestExam: function () {
			var oViewModel = this.getModel("candidateProcessModel");
			var aExams = oViewModel.getProperty("/CandidateRequestExamSet");
			var oExam = oViewModel.getProperty("/CandidateRequestExamEdit");
			var sIndex = _.findIndex(aExams, ["Exmgu", oExam.Exmgu]);
			if (sIndex !== -1) {
				aExams[sIndex] = oExam;
			} else {
				aExams.push(oExam);
			}
			oViewModel.setProperty("/CandidateRequestExamSet", aExams);
			this._editRequestExamDialog.close();
			oViewModel.refresh(true);
			this._callMessageToast(this.getText("SAVE_FOR_CHANGES"), "W");
		},
		onCancelEditRequestExam: function () {
			this._editRequestExamDialog.close();
		},

		onNavItemSelected: function (oEvent) {
			var oNavContainer = this.byId("idPageNavigationContainer");
			var sRowIid = oEvent.getParameter("rowIid");

			this._resetNavContainer();

			var oTargetPage = oNavContainer.getPages()[sRowIid];
			try {
				if (oTargetPage && !_.isEqual(oNavContainer.getCurrentPage(), oTargetPage)) {
					oNavContainer.to(oTargetPage.getId());
				}
			} catch (oEx) {
				jQuery.sap.log.error("Navigation failed:" + oTargetPage + ", Hata:" + oEx);
			}
		},
		onSetPlannedBeginDate: function () {
			var oViewModel = this.getModel("candidateProcessModel");
			var oProcess = oViewModel.getProperty("/CandidateProcess");
			var sPlbeg = oViewModel.getProperty("/CandidatePlannedStartDate");

			if (!sPlbeg) {
				this._callMessageToast(this.getText("Planlanan başlangıç tarihini giriniz"), "E");
				return;
			}

			var oModel = this.getModel();
			var oThis = this;

			var oUrlParameters = {
				"Erfid": oProcess.Erfid,
				"Tclas": oProcess.Tclas,
				"Pernr": oProcess.Pernr,
				"Plbeg": sPlbeg
			};
			this._openBusyFragment(oThis.getText("PLANNED_BEGIN_DATE_IS_BEING_SET"));
			oModel.callFunction("/SetCandidateStartDate", {
				method: "POST",
				urlParameters: oUrlParameters,
				success: function (oData, oResponse) {
					oThis._closeBusyFragment();
					if (oData.Type !== "E") {
						oThis._callMessageToast(oThis.getText("PLANNED_BEGIN_DATE_SET"), "S");
					} else {
						oThis._callMessageToast(oThis.getText("ERROR_OCCURED", [oData.Message]), "E");
					}
				},
				error: function (oError) {
					oThis._closeBusyFragment();
				}
			});
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
			var oViewModel = this.getModel("candidateProcessModel");
			// var oNC = this.byId("idPageNavigationContainer");

			// try {
			// 	oNC.to(oNC.getPages()[0].getId());
			// } catch (oErr) {
			// 	jQuery.sap.log.error("Nav container error:" + oErr);
			// }

			oViewModel.setData({
				processKey: {},
				SidebarData: {
					visible: false,
					navigationData: [],
					candidateInfo: {},
					candidateStatusInfo: [],
					requestOwnerInfo: {},
					requestStatusInfo: []
				},
				CandidateActions: [],
				CandidateInterviewPlan: {
					Erfid: null,
					Tclas: null,
					Pernr: null,
					Inttg: false,
					IntdtHr: new Date(new Date().setDate(new Date().getDate() + 7)),
					InttmHr: 32400000,
					IntvwHr: null,
					IntvnHr: null,
					IntntHr: "",
					IntguHr: null,
					Inp01Hr: null,
					Inp01nHr: null,
					Inp02Hr: null,
					Inp02nHr: null,
					Inp03Hr: null,
					Inp03nHr: null,
					IntdtDp: new Date(new Date().setDate(new Date().getDate() + 7)),
					InttmDp: 32400000,
					IntvwDp: null,
					IntvnDp: null,
					IntntDp: "",
					IntguDp: null,
					Inp01Dp: null,
					Inp01nDp: null,
					Inp02Dp: null,
					Inp02nDp: null,
					Inp03Dp: null,
					Inp03nDp: null,
					TraexHr: false, //Seyahat formu var
					TrnexHr: false, //Transfer formu var
					TraexDp: false, //Seyahat formu var
					TrnexDp: false, //Transfer formu var
					PlanHr: false,
					PlanDp: false,
					ParticipantsHr: [],
					ParticipantsDp: [],
					CandidateTravelFormHr: {
						Erfid: null,
						Inpft: "F",
						Intgu: null,
						Plcar: "",
						Cnard: null,
						Cnart: null,
						Plcdp: "",
						Plard: null,
						Plart: null
					},
					CandidateTravelFormDp: {
						Erfid: null,
						Inpft: "F",
						Intgu: null,
						Plcar: "",
						Cnard: null,
						Cnart: null,
						Plcdp: "",
						Plard: null,
						Plart: null
					},
					CandidateTransferFormHr: {
						Erfid: null,
						Inpft: "T",
						Intgu: null,
						Plcar: "",
						Cnard: null,
						Cnart: null,
						Plcdp: "",
						Plard: null,
						Plart: null
					},
					CandidateTransferFormDp: {
						Erfid: null,
						Inpft: "T",
						Intgu: null,
						Plcar: "",
						Cnard: null,
						Cnart: null,
						Plcdp: "",
						Plard: null,
						Plart: null
					}
				},
				CandidateInterviewOperation: {
					Erfid: null,
					Tclas: null,
					Pernr: null,
					Inttg: false,
					IntdtHr: null,
					InttmHr: null,
					IntvwHr: null,
					IntvnHr: null,
					IntntHr: null,
					IntguHr: null,
					Inp01Hr: null,
					Inp01nHr: null,
					Inp02Hr: null,
					Inp02nHr: null,
					Inp03Hr: null,
					Inp03nHr: null,
					IntdtDp: null,
					InttmDp: null,
					IntvwDp: null,
					IntvnDp: null,
					IntntDp: null,
					IntguDp: null,
					Inp01Dp: null,
					Inp01nDp: null,
					Inp02Dp: null,
					Inp02nDp: null,
					Inp03Dp: null,
					Inp03nDp: null,
					CandidateTravelFormSet: [],
					CandidateTransferFormSet: [],
					CandidateInterviewFormSet: []
				},
				CandidateTravelFormHR: {},
				CandidateTravelFormDP: {},
				CandidateTransferFormHR: {},
				CandidateTransferFormDP: {},
				CandidateProcess: {},
				CandidatePlannedStartDate: null,
				CandidateReferenceCheck: [],
				CandidateReferenceQuestions: [],
				ViewSettings: {
					InterviewHR: false,
					InterviewDP: false,
					WageInit: false,
					WageOffer: false,
					WageReview: false,
					EditCandidate: false,
					JobOfferEdit: false,
					RecruitmentAdmin: false
				},
				CandidateReferenceCheckEdit: {
					CandidateReferenceQuestionsSet: []
				},
				ValueHelpText: {
					"Exmid": "Exmid",
					"Exscl": "Exscl"
				},
				CandidateValueHelpText: {
					"Scexp": "Scexp",
					"Enlvl": "Enlvl",
					"Trgun": "Trgun",
					"Iseng": "Iseng",
					"Poscl": "Poscl",
					"Zbelg": "Zbelg",
					"Taete": "Taete",
					"Lanid": "Lanid",
					"Refln": "Refln",
					"Rdlvl": "Rdlvl",
					"Wrlvl": "Wrlvl",
					"Splvl": "Splvl",
					"Explc": "Explc",
					"Exmid": "Exmid",
					"Zeinh": "Zeinh",
					"Refty": "Refty",
					"Subty": "Subty",
					"Usrty": "Usrty",
					"Slart": "Slart",
					"Egitim": "Egitim",
					"Attty": "Attty",
					"Canat": "Canat",
					"Erfat": "Erfat",
					"Intty": "Intty",
					"Gblnd": "Gblnd",
					"Natio": "Natio",
					"State": "State",
					"Land1": "Land1"
				},
				StatusChangeDialogProperties: {},
				OfferRejectionDialogProperties: {},
				InterviewPlanned: false,
				CandidateJobOffer: {},
				CandidateWage: {},
				CandidateUserForm: {},
				CandidateRequestExamSet: [],
				CandidateRequestExamSavedSet: []

			});

		},
		// Attachment Kısmı Başlangıç
		onDeleteAttachment: function (oEvent) {
			var oModel = this.getModel();
			var oThis = this;
			var oViewModel = this.getModel("candidateProcessModel");
			var Attid = oEvent.getSource().getBindingContext().getProperty("Attid");
			var sPath = "/CandidateAttachmentSet(Attid=guid'" + Attid + "')";
			var _doDeleteAttachment = function () {
				oViewModel.setProperty("/busy", true);

				oModel.remove(sPath, {
					success: function (oData, oResponse) {
						if (oResponse["headers"]["message"]) {
							oThis._callMessageToast("Aday evrağı silerken hata", "E");
						} else {
							oThis._callMessageToast("Aday evrağı başarıyla silindi", "S");
						}
						oViewModel.setProperty("/busy", false);
					},
					error: function (oError) {

					}
				});

			};
			var oBeginButtonProp = {
				text: this.getText("DELETE"),
				type: "Reject",
				icon: "sap-icon://delete",
				onPressed: _doDeleteAttachment

			};

			this._callConfirmDialog(this.getText("CONFIRMATION_REQUIRED"), "Message", "Warning", this.getText("CONFIRM_DELETION"),
				oBeginButtonProp, null).open();
		},

		onAttachDownload: function (oEvent) {
			var oModel = this.getModel();
			var Attid = oEvent.getSource().getBindingContext().getProperty("Attid");
			var oUrlPath = oModel.sServiceUrl + "/CandidateAttachmentSet(Attid=guid'" + Attid + "')/$value";
			window.open(oUrlPath);
		},
		onMenuSelect: function (oEvent) {
			var sCaller = oEvent.getSource().data("callerTable");
			this._openUploadAttachmentDialog(oEvent.getParameter("item").getProperty("key"), sCaller);
		},
		onFileTypeMissmatch: function (oEvent) {
			var aFileTypes = oEvent.getSource().getFileType();
			jQuery.each(aFileTypes, function (key, value) {
				aFileTypes[key] = "*." + value;
			});
			var sSupportedFileTypes = aFileTypes.join(", ");
			sap.m.MessageBox.warning(this.getResourceBundle().getText("FILE_TYPE_MISMATCH", [oEvent.getParameter("fileType"),
				sSupportedFileTypes
			]));
		},
		onAttachmentUploadPress: function (oEvent) {
			var oFileUploader = sap.ui.getCore().byId("idAttachmentFileUploader");
			var oModel = this.getModel();
			var oProcess = SharedData.getCandidateProcess();

			if (!oFileUploader.getValue()) {
				this._callMessageToast(this.getText("FILE_SELECTION_REQUIRED"), "W");
				return;
			}

			/*Destroy header parameters*/
			oFileUploader.destroyHeaderParameters();

			/*Set security token*/
			oModel.refreshSecurityToken();
			oFileUploader.addHeaderParameter(new sap.ui.unified.FileUploaderParameter({
				name: "x-csrf-token",
				value: oModel.getSecurityToken()
			}));

			/*Set filename*/
			var sFileName = oFileUploader.getValue();
			sFileName = encodeURIComponent(sFileName);
			oFileUploader.addHeaderParameter(new sap.ui.unified.FileUploaderParameter({
				name: "content-disposition",
				value: "inline; filename='" + sFileName + "'"
			}));

			/*Set upload path*/
			var sPath = "";
			var sAttty = this._oUploadAttachmentDialog.data("AttachmentType");
			var sCaller = this._oUploadAttachmentDialog.data("Caller");

			switch (sCaller) {
			case "CPA":

				sPath = oModel.sServiceUrl + "/CandidateProcessAttachmentSet(Tclas='" + oProcess.Tclas + "',Pernr='" + oProcess.Pernr +
					"',Erfid='" + oProcess.Erfid + "',Attty='" + sAttty +
					"')/CandidateAttachmentSet";
				break;

			case "CA":
				sPath = oModel.sServiceUrl + "/CandidateAttachmentOperationSet(Tclas='" + oProcess.Tclas + "',Pernr='" + oProcess.Pernr +
					"',Attty='" + sAttty +
					"')/CandidateAttachmentSet";
				break;

			default:
				return;

			}

			oFileUploader.setUploadUrl(sPath);

			/*Upload file*/

			oFileUploader.upload();
		},

		onAttachmentUploadComplete: function (oEvent) {
			var oFileUploader = sap.ui.getCore().byId("idAttachmentFileUploader");
			oFileUploader.destroyHeaderParameters();
			oFileUploader.clear();

			var sStatus = oEvent.getParameter("status");
			var sResponse = oEvent.getParameter("response");
			this._closeBusyFragment();
			if (sStatus == "201" || sStatus == "200") {
				this._callMessageToast(this.getText("FILE_UPLOAD_SUCCESS"), "S");
				this._oUploadAttachmentDialog.close();
			} else {
				this._callMessageToast(this.getText("FILE_UPLOAD_ERROR", [sResponse]), "E");
			}
			this.getModel().refresh(true);
		},

		onAttachmentFileChange: function (oEvent) {
			this._callMessageToast(this.getText("FILE_UPLOAD_WARNING", [oEvent.getParameter("newValue")]), "W");
		},

		onFileSizeExceed: function (oEvent) {
			this._callMessageToast(this.getText("FILE_SIZE_EXCEEDED", [oEvent.getSource().getMaximumFileSize()]), "E");
		},
		onCloseUploadFormDialog: function () {
			this._callMessageToast(this.getText("FILE_UPLOAD_CANCELLED"), "W");
			this._oUploadAttachmentDialog.close();
		},
		onTogglePlanInterview: function () {
			var oViewModel = this.getModel("candidateProcessModel");
			var oPlan = oViewModel.getProperty("/CandidateInterviewPlan");

			oPlan.Inttg = oPlan.Inttg ? false : true;
			oPlan.PlanDp = oPlan.Inttg ? true : oPlan.PlanHr ? false : true;

			if (!oPlan.PlandDp) {
				oPlan.ParticipantsDp = [];
			}

			oViewModel.setProperty("/CandidateInterviewPlan", oPlan);
		},
		onReferenceCheckFormPrintOut: function (oEvent) {
			var oViewModel = this.getModel("candidateProcessModel");
			var oProcess = oViewModel.getProperty("/CandidateProcess");
			var sPath = "/sap/opu/odata/sap/ZHCM_RECRUITMENT_SRV/CandidateReferenceCheckFormSet(Erfid='" + oProcess.Erfid + "',Tclas='" +
				oProcess.Tclas +
				"',Pernr='" + oProcess.Pernr + "')/$value";
			var sTitle = this.getText("REFERENCE_CHECK_PRINT_OUT", [oProcess.Ename]);

			this._callPDFViewer(sPath, sTitle);
		},
		onJobOfferFormPrintOut: function (oEvent) {
			var oViewModel = this.getModel("candidateProcessModel");
			var oProcess = oViewModel.getProperty("/CandidateProcess");
			var sPath = "/sap/opu/odata/sap/ZHCM_RECRUITMENT_SRV/CandidateJobOfferPrintOutSet(Erfid='" + oProcess.Erfid + "',Tclas='" +
				oProcess.Tclas +
				"',Pernr='" + oProcess.Pernr + "')/$value";
			var sTitle = this.getText("JOB_OFFER_FORM_PRINT_OUT", [oProcess.Ename]);

			this._callPDFViewer(sPath, sTitle);
		},
		onUserFormPrintOut: function (oEvent) {
			var oViewModel = this.getModel("candidateProcessModel");
			var oProcess = oViewModel.getProperty("/CandidateProcess");
			var sPath = "/sap/opu/odata/sap/ZHCM_RECRUITMENT_SRV/CandidateUserFormPrintOutSet(Erfid='" + oProcess.Erfid + "',Tclas='" +
				oProcess.Tclas +
				"',Pernr='" + oProcess.Pernr + "')/$value";
			var sTitle = this.getText("USER_FORM_PRINT_OUT", [oProcess.Ename,
				this.getText(oProcess.Tclas === 'A' ? "INTERNAL_APPLICANT" : "EXTERNAL_APPLICANT")
			]);

			this._callPDFViewer(sPath, sTitle);
		},
		onEmployeeRequestFormPrintOut: function (oEvent) {
			var oViewModel = this.getModel("candidateProcessModel");
			var oRequest = oViewModel.getProperty("/EmployeeRequestForm");
			var sPrintOutPath = "/sap/opu/odata/sap/ZHCM_RECRUITMENT_SRV/EmployeeRequestFormSet('" +
				oRequest.Erfid + "')/EmployeeRequestPrintOut/$value";
			var sPlstx = oRequest.Nopln ? oRequest.Plaft : oRequest.Plstx;
			var sPrintOutTitle = this.getText("REQUEST_PRINT_OUT_TITLE", [sPlstx]);

			this._callPDFViewer(sPrintOutPath, sPrintOutTitle);
		},
		onCandidateResumePrintOut: function (oEvent) {
			var oViewModel = this.getModel("candidateProcessModel");
			var oProcess = oViewModel.getProperty("/CandidateProcess");
			var sPath = "/sap/opu/odata/sap/ZHCM_RECRUITMENT_SRV/CandidateResumeSet(Tclas='" + oProcess.Tclas + "'," +
				"Pernr='" + oProcess.Pernr + "')/$value";
			var sTitle = this.getText("CANDIDATE_RESUME", [oProcess.Ename,
				this.getText(oProcess.Tclas === 'A' ? "INTERNAL_APPLICANT" : "EXTERNAL_APPLICANT")
			]);

			this._callPDFViewer(sPath, sTitle);
		},
		onInterviewFormPrintOut: function (oEvent) {
			var oViewModel = this.getModel("candidateProcessModel");
			var oProcess = oViewModel.getProperty("/CandidateProcess");
			var sPath = "/sap/opu/odata/sap/ZHCM_RECRUITMENT_SRV/CandidateInterviewFormPrintOutSet(Erfid='" + oProcess.Erfid + "',Tclas='" +
				oProcess.Tclas +
				"',Pernr='" + oProcess.Pernr + "')/$value";
			var sTitle = this.getText("INTERVIEW_FORM_PRINT_OUT", [oProcess.Ename,
				this.getText(oProcess.Tclas === 'A' ? "INTERNAL_APPLICANT" : "EXTERNAL_APPLICANT")
			]);

			this._callPDFViewer(sPath, sTitle);
		},
		onPaytySelected: function (oEvent) {
			var oSource = oEvent.getSource();
			var sTargetField = oSource.data("targetField");
			var sTargetValue = oSource.data("targetValue");
			var oViewModel = this.getModel("candidateProcessModel");
			oViewModel.setProperty(sTargetField, sTargetValue);
		},
		/**
		 * Pattern matched
		 * @function
		 * @param {sap.ui.base.Ev.oEvent pattern match event in route 'object'
		 * @private
		 */
		_openUploadAttachmentDialog: function (sAttty, sCaller) {

			// create dialog lazily
			if (!this._oUploadAttachmentDialog) {
				// create dialog via fragment factory
				this._oUploadAttachmentDialog = sap.ui.xmlfragment("com.bmc.hcm.erf.fragment.UploadAttachments", this);
				// connect dialog to view (models, lifecycle)
				this.getView().addDependent(this._oUploadAttachmentDialog);
			}

			var oFileUploader = sap.ui.getCore().byId("idAttachmentFileUploader");
			try {
				if (oFileUploader) {
					oFileUploader.clear();
				}
			} catch (oErr) {
				jQuery.sap.log.error("File uploader not loaded yet...");
			}
			this._oUploadAttachmentDialog.data("AttachmentType", sAttty);
			this._oUploadAttachmentDialog.data("Caller", sCaller);
			this._oUploadAttachmentDialog.open();
		},
		_setExamData: function (oExamData) {
			var oViewModel = this.getModel("candidateProcessModel");
			var oExamCopy = [];
			try {
				oExamData = oExamData.results;
			} catch (oEx) {
				jQuery.sap.log.error(oEx);
			}
			oViewModel.setProperty("/CandidateRequestExamSet", oExamData);
			oExamCopy = _.cloneDeep(oExamData);
			oViewModel.setProperty("/CandidateRequestExamSavedSet", oExamCopy);
		},
		_setUserFormData: function (oUserFormData) {
			var oViewModel = this.getModel("candidateProcessModel");
			try {
				if (oUserFormData.hasOwnProperty("CandidateUserFormSectionSet")) {

					if (oUserFormData.CandidateUserFormSectionSet.results.length > 0) {
						oUserFormData.CandidateUserFormSectionSet = oUserFormData.CandidateUserFormSectionSet.results;
					}
					$.each(oUserFormData.CandidateUserFormSectionSet, function (sIndex, oFormSection) {
						if (oFormSection.hasOwnProperty("CandidateUserFormElementSet")) {
							oFormSection.CandidateUserFormElementSet = oFormSection.CandidateUserFormElementSet.results;
						}
					});
				}
			} catch (oEx) {
				jQuery.sap.log.error(oEx);
			}
			oViewModel.setProperty("/CandidateUserForm", oUserFormData);
		},
		_setProcessHistory: function (oProcessHistory) {
			var oViewModel = this.getModel("candidateProcessModel");
			try {
				oProcessHistory = oProcessHistory.results;
			} catch (oEx) {
				jQuery.sap.log.error(oEx);
			}
			oViewModel.setProperty("/CandidateProcessHistorySet", oProcessHistory);
		},
		_setWageData: function (oWageData, oDefaultBenefitData) {
			var oViewModel = this.getModel("candidateProcessModel");
			var sProcess = SharedData.getCandidateProcess();
			try {
				if (oWageData.Erfid === "") {
					oWageData.Erfid = sProcess.Erfid;
					oWageData.Tclas = sProcess.Tclas;
					oWageData.Pernr = sProcess.Pernr;
					oWageData.CrslrWaers = oWageData.ExslrWaers = oWageData.OfslrWaers = "TRY";
					oWageData.GivenBenefitSet = _.cloneDeep(oDefaultBenefitData.results);
				} else {
					if (oWageData.hasOwnProperty("GivenBenefitSet")) {
						if (oWageData.GivenBenefitSet.results.length > 0) {
							oWageData.GivenBenefitSet = oWageData.GivenBenefitSet.results;
						} else {
							oWageData.GivenBenefitSet = _.cloneDeep(oDefaultBenefitData.results);
						}

					}
				}
			} catch (oEx) {
				jQuery.sap.log.error(oEx);
			}
			oViewModel.setProperty("/CandidateWage", oWageData);
		},
		_setReferenceCheckData: function (oReferenceCheck, oReferenceQuestions) {
			var oViewModel = this.getModel("candidateProcessModel");
			try {
				if (oReferenceQuestions.hasOwnProperty("results")) {
					oReferenceQuestions = oReferenceQuestions.results;
				}
				oReferenceCheck = oReferenceCheck.results;
				$.each(oReferenceCheck, function (sKey, oReference) {
					oReference.CandidateReferenceQuestionsSet = oReference.CandidateReferenceQuestionsSet.results;
				});
			} catch (oEx) {
				jQuery.sap.log.error(oEx);
			}
			oViewModel.setProperty("/CandidateReferenceCheck", oReferenceCheck);
			oViewModel.setProperty("/CandidateReferenceQuestions", oReferenceQuestions);
		},
		_setInterviewData: function (oData) {
			var oViewModel = this.getModel("candidateProcessModel");
			var oOperation = oData;
			oOperation.CandidateTravelFormSet = oOperation.CandidateTravelFormSet.results;
			oOperation.CandidateTransferFormSet = oOperation.CandidateTransferFormSet.results;
			oOperation.CandidateInterviewFormSet = oOperation.CandidateInterviewFormSet.results;
			$.each(oOperation.CandidateInterviewFormSet, function (sKey, oInterviewForm) {
				oInterviewForm.CandidateInterviewQuestionsSet = oInterviewForm.CandidateInterviewQuestionsSet.results;
				$.each(oInterviewForm.CandidateInterviewQuestionsSet, function (sInd, oQuestion) {
					oQuestion.CandidateInterviewAnswersSet = oQuestion.CandidateInterviewAnswersSet.results;
				});
			});
			oViewModel.setProperty("/CandidateInterviewOperation", oOperation);
			this._setTravelTransferForms();
		},
		_setTravelTransferForms: function () {
			var oViewModel = this.getModel("candidateProcessModel");
			var oInterviewOperation = oViewModel.getProperty("/CandidateInterviewOperation");

			var oTravelFormHr = _.find(oInterviewOperation.CandidateTravelFormSet, ["Intgu", oInterviewOperation.IntguHr]);
			var oTravelFormDp = _.find(oInterviewOperation.CandidateTravelFormSet, ["Intgu", oInterviewOperation.IntguDp]);

			var oTransferFormHr = _.find(oInterviewOperation.CandidateTransferFormSet, ["Intgu", oInterviewOperation.IntguHr]);
			var oTransferFormDp = _.find(oInterviewOperation.CandidateTransferFormSet, ["Intgu", oInterviewOperation.IntguDp]);

			if (oTravelFormHr) {
				oTravelFormHr.Exist = true;
			} else {
				oTravelFormHr = {};
				oTravelFormHr.Exist = false;
			}

			if (oTravelFormDp) {
				oTravelFormDp.Exist = true;
			} else {
				oTravelFormDp = {};
				oTravelFormDp.Exist = false;
			}
			if (oTransferFormHr) {
				oTransferFormHr.Exist = true;
			} else {
				oTransferFormHr = {};
				oTransferFormHr.Exist = false;
			}

			if (oTransferFormDp) {
				oTransferFormDp.Exist = true;
			} else {
				oTransferFormDp = {};
				oTransferFormDp.Exist = false;
			}

			oViewModel.setProperty("/CandidateTravelFormHR", oTravelFormHr);
			oViewModel.setProperty("/CandidateTransferFormHR", oTransferFormHr);
			oViewModel.setProperty("/CandidateTravelFormDP", oTravelFormDp);
			oViewModel.setProperty("/CandidateTransferFormDP", oTransferFormDp);

		},
		_setInterviewPlan: function (sButtonId) {
			var oViewModel = this.getModel("candidateProcessModel");
			var oInterviewOperation = oViewModel.getProperty("/CandidateInterviewOperation");
			var oProcess = SharedData.getCandidateProcess();
			var oRequest = SharedData.getCurrentRequest();

			if (!oRequest) {
				oRequest = oViewModel.getProperty("/EmployeeRequestForm");
			}

			var oCurrentUser = SharedData.getCurrentUser();

			var oTravelFormHr = _.find(oInterviewOperation.CandidateTravelFormSet, ["Intgu", oInterviewOperation.IntguHr]);
			var oTravelFormDp = _.find(oInterviewOperation.CandidateTravelFormSet, ["Intgu", oInterviewOperation.IntguDp]);

			var oTransferFormHr = _.find(oInterviewOperation.CandidateTransferFormSet, ["Intgu", oInterviewOperation.IntguHr]);
			var oTransferFormDp = _.find(oInterviewOperation.CandidateTransferFormSet, ["Intgu", oInterviewOperation.IntguDp]);

			var oInterviewPlan = oViewModel.getProperty("/CandidateInterviewPlan");

			//Copy all the attributes that matches
			_.extend(oInterviewPlan, _.pick(oInterviewOperation, _.keys(oInterviewPlan)));

			oInterviewPlan.TraexHr = oTravelFormHr ? true : false;
			oInterviewPlan.TraexDp = oTravelFormDp ? true : false;
			oInterviewPlan.TrnexHr = oTransferFormHr ? true : false;
			oInterviewPlan.TrnexDp = oTransferFormDp ? true : false;
			oInterviewPlan.Erfid = oProcess.Erfid;
			oInterviewPlan.Tclas = oProcess.Tclas;
			oInterviewPlan.Pernr = oProcess.Pernr;

			if (!oInterviewPlan.IntguHr || oInterviewPlan.IntguHr === "") {
				oInterviewPlan.IntguHr = this.createGUID();
				oInterviewPlan.IntguDp = this.createGUID();
			}
			if (!oInterviewPlan.IntguDp || oInterviewPlan.IntguDp === "") {
				oInterviewPlan.IntguHr = this.createGUID();
				oInterviewPlan.IntguDp = this.createGUID();
			}

			switch (sButtonId) {
			case "CP_HR_INT_PL":
			case "CP_HR_INT_PLR":
				oInterviewPlan.PlanHr = true;
				oInterviewPlan.PlanDp = false;
				break;
			case "CP_HR_INT":
			case "CP_DEP_INT":
			case "CP_DEP_INT_PL":
			case "CP_DEP_INT_PLR":
				oInterviewPlan.PlanHr = false;
				oInterviewPlan.PlanDp = true;
				break;
			}

			oInterviewPlan.ParticipantsHr = [];
			oInterviewPlan.ParticipantsDp = [];

			if (oInterviewOperation.Inp01Hr !== "00000000" && oInterviewOperation.Inp01Hr) {
				oInterviewPlan.ParticipantsHr.push({
					Inper: oInterviewOperation.Inp01Hr,
					Inpnm: oInterviewOperation.Inp01nHr
				});
			}
			if (oInterviewOperation.Inp02Hr !== "00000000" && oInterviewOperation.Inp02Hr) {
				oInterviewPlan.ParticipantsHr.push({
					Inper: oInterviewOperation.Inp02Hr,
					Inpnm: oInterviewOperation.Inp02nHr
				});
			}
			if (oInterviewOperation.Inp03Hr !== "00000000" && oInterviewOperation.Inp03Hr) {
				oInterviewPlan.ParticipantsHr.push({
					Inper: oInterviewOperation.Inp03Hr,
					Inpnm: oInterviewOperation.Inp03nHr
				});
			}
			if (oInterviewOperation.Inp01Dp !== "00000000" && oInterviewOperation.Inp01Dp) {
				oInterviewPlan.ParticipantsDp.push({
					Inper: oInterviewOperation.Inp01Dp,
					Inpnm: oInterviewOperation.Inp01nDp
				});
			}
			if (oInterviewOperation.Inp02Dp !== "00000000" && oInterviewOperation.Inp02Dp) {
				oInterviewPlan.ParticipantsDp.push({
					Inper: oInterviewOperation.Inp02Dp,
					Inpnm: oInterviewOperation.Inp02nDp
				});
			}
			if (oInterviewOperation.Inp03Dp !== "00000000" && oInterviewOperation.Inp03Dp) {
				oInterviewPlan.ParticipantsDp.push({
					Inper: oInterviewOperation.Inp03Dp,
					Inpnm: oInterviewOperation.Inp03nDp
				});
			}

			if (oTravelFormHr) {
				oInterviewPlan.CandidateTravelFormHr = _.cloneDeep(oTravelFormHr);
			} else {
				oInterviewPlan.CandidateTravelFormHr = {
					Erfid: oInterviewPlan.Erfid,
					Inpft: "F",
					Intgu: oInterviewPlan.IntguHr,
					Plcar: "",
					Cnard: null,
					Cnart: null,
					Plcdp: "",
					Plard: null,
					Plart: null
				};
			}

			if (oTransferFormHr) {
				oInterviewPlan.CandidateTransferFormHr = _.cloneDeep(oTransferFormHr);
			} else {
				oInterviewPlan.CandidateTransferFormHr = {
					Erfid: oInterviewPlan.Erfid,
					Inpft: "T",
					Intgu: oInterviewPlan.IntguHr,
					Plcar: "",
					Cnard: null,
					Cnart: null,
					Plcdp: "",
					Plard: null,
					Plart: null
				};
			}

			if (oTravelFormDp) {
				oInterviewPlan.CandidateTravelFormDp = _.cloneDeep(oTravelFormDp);
			} else {
				oInterviewPlan.CandidateTravelFormDp = {
					Erfid: oInterviewPlan.Erfid,
					Inpft: "F",
					Intgu: oInterviewPlan.IntguDp,
					Plcar: "",
					Cnard: null,
					Cnart: null,
					Plcdp: "",
					Plard: null,
					Plart: null
				};
			}

			if (oTransferFormDp) {
				oInterviewPlan.CandidateTransferFormDp = _.cloneDeep(oTransferFormDp);
			} else {
				oInterviewPlan.CandidateTransferFormDp = {
					Erfid: oInterviewPlan.Erfid,
					Inpft: "T",
					Intgu: oInterviewPlan.IntguDp,
					Plcar: "",
					Cnard: null,
					Cnart: null,
					Plcdp: "",
					Plard: null,
					Plart: null
				};
			}

			if (oInterviewPlan.IntvwHr === "00000000" || !oInterviewPlan.IntvwHr) {
				oInterviewPlan.IntvwHr = oRequest.Erfoe ? oRequest.Erfow : oCurrentUser.Pernr;
				oInterviewPlan.IntvnHr = oRequest.Erfoe ? oRequest.Erfoe : oCurrentUser.Ename;
			}

			if (oInterviewPlan.IntvwDp === "00000000" || !oInterviewPlan.IntvwDp) {
				oInterviewPlan.IntvwDp = oRequest.Rqowp;
				oInterviewPlan.IntvnDp = oRequest.Rqowe;
			}
			oViewModel.setProperty("/CandidateInterviewPlan", oInterviewPlan);
			oViewModel.setProperty("/InterviewPlanned", true);
		},
		_initialValueHelp: function () {
			var oViewModel = this.getModel("candidateProcessModel");
			var aValueHelpText = oViewModel.getProperty("/ValueHelpText");
			var aCandidateValueHelpText = oViewModel.getProperty("/CandidateValueHelpText");
			var aFilters1 = [];
			var aFilters2 = [];
			var oModel = this.getModel();

			Object.keys(aValueHelpText).map(function (item) {
				aFilters1.push(
					new Filter("Erfvh", FilterOperator.EQ, aValueHelpText[item])
				);
			});
			oModel.read("/ValueHelpSet", {
				filters: aFilters1,
				success: function (oData, oResponse) {
					oViewModel.refresh(true);
				},
				error: function (oError) {

				}
			});

			Object.keys(aCandidateValueHelpText).map(function (item) {
				aFilters2.push(
					new Filter("Help", FilterOperator.EQ, aCandidateValueHelpText[item])
				);
			});
			oModel.read("/CandidateValueHelpSet", {
				filters: aFilters2,
				success: function (oData, oResponse) {
					oViewModel.refresh(true);
				},
				error: function (oError) {

				}
			});
		},
		_getValueHelpText: function (sHelp, sValue) {
			var sPath = "";
			var oParam = null;
			var oModel = this.getModel();
			try {
				sPath = "/CandidateValueHelpSet(Help='" + sHelp + "',Key='" + sValue + "')";
				oParam = oModel.getProperty(sPath);
				if (oParam && oParam.hasOwnProperty("Text")) {
					return oParam.Text;
				} else {
					sPath = "/ValueHelpSet(Erfvh='" + sHelp + "',Fldky='" + sValue + "')";
					oParam = oModel.getProperty(sPath);
					if (oParam && oParam.hasOwnProperty("Fldvl")) {
						return oParam.Fldvl;
					} else {
						return null;
					}
				}

			} catch (oErr) {
				return null;
			}
		},
		_refreshProcessAttachment: function (oProcess) {
			var aFilterAttachment = [];
			var oAttachmentTable = this.byId("idCandidateProcessAttachmentList"); //Attachment
			if (oAttachmentTable) {
				aFilterAttachment.push(new Filter("Tclas", FilterOperator.EQ, oProcess.Tclas));
				aFilterAttachment.push(new Filter("Pernr", FilterOperator.EQ, oProcess.Pernr));
				aFilterAttachment.push(new Filter("Erfid", FilterOperator.EQ, oProcess.Erfid));
				oAttachmentTable.getBinding("items").filter(aFilterAttachment, "Application");
			}

			aFilterAttachment = [];
			oAttachmentTable = this.byId("idCandidateAttachmentList"); //Attachment
			aFilterAttachment.push(new Filter("Tclas", FilterOperator.EQ, oProcess.Tclas));
			aFilterAttachment.push(new Filter("Pernr", FilterOperator.EQ, oProcess.Pernr));
			oAttachmentTable.getBinding("items").filter(aFilterAttachment, "Application");

		},
		_checkJobHigherLevel: function (sStell) {
			var aUpperLevelJobs = SharedData.getUpperLevelJobs();

			var oJob = _.find(aUpperLevelJobs, ["Objid", sStell]);

			return oJob ? true : false;
		},
		_prepareWelcomePage: function (oEvent) {
			var oViewModel = this.getModel("candidateProcessModel");
			var aActions = oViewModel.getProperty("/CandidateActions");
			var aApproveActions = _.filter(aActions, ["Erfbs", "A"]);
			var oInterviewOperation = oViewModel.getProperty("/CandidateInterviewOperation");
			var oAction;
			var sButtonId;
			var aFragments = [];
			if (aApproveActions.length >= 1) {
				oAction = aApproveActions[0];
				if (oAction) {
					sButtonId = oAction.Erfbt;
					switch (sButtonId) {
					case "CP_HR_INT_PL":
					case "CP_HR_INT_PLR":
						this._setInterviewPlan(sButtonId);

						//aFragments.push("CandidateUserForm");
						aFragments.push("CandidatePlanInterview");
						break;
					case "CP_HR_INT":
					case "CP_DEP_INT_PL":
						if (oInterviewOperation.Inttg) {
							//Interview form as 1st page
							//Department and hr interview are planned together
							this._setInterviewPlan(sButtonId);
							aFragments.push("CandidateInterviewForm");
							oViewModel.setProperty("/ViewSettings/InterviewHR", true);
							oViewModel.setProperty("/ViewSettings/InterviewDP", false);
						} else {
							//Set second page as final page
							this._setInterviewPlan(sButtonId);
							aFragments.push("CandidateInterviewForm");
							aFragments.push("CandidatePlanInterview");
							oViewModel.setProperty("/ViewSettings/InterviewHR", true);
							oViewModel.setProperty("/ViewSettings/InterviewDP", false);
						}

						break;
					case "CP_DEP_INT":
						this._setInterviewPlan(sButtonId);
						aFragments.push("CandidateInterviewForm");
						oViewModel.setProperty("/ViewSettings/InterviewHR", false);
						oViewModel.setProperty("/ViewSettings/InterviewDP", true);

						break;
					case "CP_REF_CHK":
						aFragments.push("CandidateReferenceCheck");
						break;
					case "CP_PAY_CRI":
						aFragments.push("CandidateWageInit");
						oViewModel.setProperty("/ViewSettings/WageInit", true);
						oViewModel.setProperty("/ViewSettings/WageOffer", false);
						oViewModel.setProperty("/ViewSettings/WageReview", false);
						break;
					case "CP_PAY_CMP":
						aFragments.push("CandidateWageOffer");
						oViewModel.setProperty("/ViewSettings/WageInit", false);
						oViewModel.setProperty("/ViewSettings/WageOffer", true);
						oViewModel.setProperty("/ViewSettings/WageReview", false);
						break;
					case "CP_PAY_CHK":
						aFragments.push("CandidateWageReview");
						oViewModel.setProperty("/ViewSettings/WageInit", false);
						oViewModel.setProperty("/ViewSettings/WageOffer", false);
						oViewModel.setProperty("/ViewSettings/WageReview", true);
						break;
					case "CP_APP_CAN":
						aFragments.push("CandidateApproval");
						oViewModel.setProperty("/ViewSettings/WageInit", false);
						oViewModel.setProperty("/ViewSettings/WageOffer", false);
						oViewModel.setProperty("/ViewSettings/WageReview", true);
						break;
					case "CP_DOC_APP":
						aFragments.push("CandidateProcessSummary");
						break;
					case "CP_OFF_SND":
						aFragments.push("CandidateJobOfferEdit");
						oViewModel.setProperty("/ViewSettings/JobOfferEdit", false);
						break;
					case "CP_OFF_APP":
						aFragments.push("CandidateJobOfferReview");
						oViewModel.setProperty("/ViewSettings/JobOfferEdit", false);
						break;
					case "CP_USF_SND":
						aFragments.push("CandidateUserForm");
						break;
					case "CP_PBD_SND":
						aFragments.push("CandidateSetBeginDate");
						break;

					default:
						return;
					}
				}

				this._insertFragmentToPage(aFragments, aActions, sButtonId);

			} else {
				jQuery.sap.log.error("Defined action not found for this step!");
				aFragments.push("CandidateProcessNoAction");
				this._insertFragmentToPage(aFragments, [], null);
			}
		},
		_insertFragmentToPage: function (aFragments, aActions, sButtonId) {
			var oThis = this;
			var oPage0 = this.byId("idMainCandidateProcessPage");
			var oPage1 = this.byId("idNextCandidateProcessPage");
			var oNC = this.byId("idPageNavigationContainer");

			try {
				for (var sPropertyName in this._formFragments) {
					if (!this._formFragments.hasOwnProperty(sPropertyName)) {
						return;
					}
					this._formFragments[sPropertyName].destroy();
					this._formFragments[sPropertyName] = null;
				}
			} catch (oEx) {
				jQuery.sap.log.error(oEx);
			}

			oPage0.removeAllContent();
			oPage1.removeAllContent();

			try {
				if (aActions.length > 0) {
					oPage0.setShowFooter(true);
					oPage1.setShowFooter(true);
				} else {
					oPage0.setShowFooter(false);
					oPage1.setShowFooter(false);
				}
			} catch (oEx) {
				oPage0.setShowFooter(false);
				oPage1.setShowFooter(false);
			}

			var _getFinalToolbar = function () {
				var aContent = [];
				aContent.push(new sap.m.ToolbarSpacer());

				$.each(aActions, function (sKey, oAction) {
					aContent.push(new sap.m.Button({
						text: oAction.Erfbx,
						tooltip: oThis.getText("TARGET_STATUS", [oAction.CansyN ? oAction.CansxN + "-" + oAction.CansyN : oAction.CansxN]),
						icon: oAction.Erfbi,
						type: oThis.formatter.getFormActionType(oAction.Erfbs),
						press: function (oEvent) {
							if (sButtonId === "CP_HR_INT") {
								return oThis._validateInterviewForm(true) ? oThis.onProcessActionConfirmed(oEvent) :
									oThis._callMessageToast("Mülakat formunu eksiksiz doldurmalısınız", "W");
							} else if (sButtonId === "CP_DEP_INT") {
								return oThis._validateInterviewForm(false) ? oThis.onProcessActionConfirmed(oEvent) :
									oThis._callMessageToast("Mülakat formunu eksiksiz doldurmalısınız", "W");
							} else if (sButtonId === "CP_PBD_SND" || sButtonId === "CP_PBD_SAV") {
								if (!oThis._validateStartDate()) {
									oThis._callMessageToast("Planlanan başlangıç tarihini girmelisiniz", "W");
									return false;
								}
								if (!oThis._validatePrefferedName()) {
									oThis._callMessageToast("Kurumda tercih edilen adı girmelisiniz", "W");
									return false;
								}

								oThis.onProcessActionConfirmed(oEvent);

							} else {
								oThis.onProcessActionConfirmed(oEvent);
							}
							return true;
						}

					}).data("buttonId", oAction.Erfbt));
				});

				return new sap.m.OverflowToolbar({
					content: aContent
				});
			};

			var _getNextToolbar = function (oFunc) {
				return new sap.m.OverflowToolbar({
					content: [
						new sap.m.ToolbarSpacer(),
						new sap.m.Button({
							text: "{i18n>CONTINUE_ACTION}",
							icon: "sap-icon://navigation-right-arrow",
							type: "Emphasized",
							press: function () {
								if (sButtonId === "CP_HR_INT") {
									return oThis._validateInterviewForm(true) ? oNC.to(oPage1.getId()) :
										oThis._callMessageToast("Mülakat formunu eksiksiz doldurmalısınız", "W");
								} else if (sButtonId === "CP_DEP_INT") {
									return oThis._validateInterviewForm(false) ? oNC.to(oPage1.getId()) :
										oThis._callMessageToast("Mülakat formunu eksiksiz doldurmalısınız", "W");
								} else {
									oNC.to(oPage1.getId());
								}
								return true;
							}
						})
					]
				});
			};

			if (aFragments.length === 1) {
				oPage0.insertContent(oThis._getFragment(aFragments[0]), 0);
				oPage0.setFooter(_getFinalToolbar());
			} else if (aFragments.length > 1) {

				oPage0.insertContent(oThis._getFragment(aFragments[0]), 0);
				oPage0.setFooter(_getNextToolbar());

				oPage1.insertContent(oThis._getFragment(aFragments[1]), 0);
				oPage1.setFooter(_getFinalToolbar());
				oPage1.attachNavButtonPress(null, function () {
					oNC.to(oPage0.getId());
				}, this);
			}

			oNC.to(oPage0.getId());

			jQuery.sap.delayedCall(1000, null, function () {
				$(".sapUiHiddenPlaceholder").parent(".sapUiRespGridSpanXL4").css("display", "none");
				$(".sapUiHiddenPlaceholder").parent(".sapUiRespGridSpanXL1").css("display", "none");
			});

		},
		_onCandidateProcessMatched: function (oEvent) {
			var oProcess = SharedData.getCandidateProcess();
			var oThis = this;

			this._initiateModels();

			if (!oProcess || !oProcess.hasOwnProperty("Tclas") || !oProcess.hasOwnProperty("Pernr") ||
				!oProcess.hasOwnProperty("Erfid")) {
				//Redirect to main page
				this.getRouter().navTo("appdispatcher", {}, true);
				return;
			}

			this._initialValueHelp();

			var oModel = this.getModel();
			var oViewModel = this.getModel("candidateProcessModel");

			oViewModel.setProperty("/processKey", oProcess);
			oViewModel.setProperty("/ViewSettings/EditCandidate", SharedData.getApplicationAuth().ErfrcApp || SharedData.getApplicationAuth().ErfraApp);
			oViewModel.setProperty("/ViewSettings/RecruitmentAdmin", SharedData.getApplicationAuth().ErfraApp);

			var sQuery = "/CandidateProcessOperationsSet(Erfid='" + oProcess.Erfid +
				"',Tclas='" + oProcess.Tclas + "',Pernr='" + oProcess.Pernr + "')";

			var sExpand =
				"EmployeeRequestForm,CandidateProcess,CandidateActionsSet,CandidateInterviewOperation," +
				"CandidateReferenceCheckSet,CandidateReferenceQuestionsSet,CandidateWage,CandidateInfo," +
				"GivenBenefitSet,CandidateJobOffer,CandidateRequestExamSet,CandidateUserForm,CandidateProcessHistorySet," +
				"CandidateInterviewOperation/CandidateTravelFormSet," +
				"CandidateInterviewOperation/CandidateTransferFormSet," +
				"CandidateInterviewOperation/CandidateInterviewFormSet," +
				"CandidateInterviewOperation/CandidateInterviewFormSet/CandidateInterviewQuestionsSet," +
				"CandidateInterviewOperation/CandidateInterviewFormSet/CandidateInterviewQuestionsSet/CandidateInterviewAnswersSet," +
				"CandidateReferenceCheckSet/CandidateReferenceQuestionsSet," +
				"CandidateWage/GivenBenefitSet," +
				"CandidateUserForm/CandidateUserFormSectionSet," +
				"CandidateUserForm/CandidateUserFormSectionSet/CandidateUserFormElementSet";

			//aFilters.push(new Filter("Actio", FilterOperator.EQ, "GET"));
			this._openBusyFragment("CANDIDATE_PROCESS_BEING_READ", []);
			oModel.read(sQuery, {
				urlParameters: {
					"$expand": sExpand
				},
				success: function (oData, oResponse) {
					oViewModel.setProperty("/CandidateActions", oData.CandidateActionsSet.results);
					oViewModel.setProperty("/CandidateProcess", oData.CandidateProcess);
					if (oData.CandidateProcess.hasOwnProperty("Plbeg")) {
						oViewModel.setProperty("/CandidatePlannedStartDate", _.clone(oData.CandidateProcess.Plbeg));
					}
					oViewModel.setProperty("/CandidateInfo", oData.CandidateInfo);
					oViewModel.setProperty("/EmployeeRequestForm", oData.EmployeeRequestForm);
					oViewModel.setProperty("/CandidateJobOffer", oData.CandidateJobOffer);
					oThis._prepareSidebarData(oData);
					oThis._setInterviewData(oData.CandidateInterviewOperation);
					oThis._setReferenceCheckData(oData.CandidateReferenceCheckSet, oData.CandidateReferenceQuestionsSet);
					oThis._setWageData(oData.CandidateWage, oData.GivenBenefitSet);
					oThis._setUserFormData(oData.CandidateUserForm);
					oThis._setExamData(oData.CandidateRequestExamSet);
					oThis._setProcessHistory(oData.CandidateProcessHistorySet);
					oThis._refreshProcessAttachment(oProcess);
					oThis._prepareWelcomePage();
					oThis._closeBusyFragment();

				},
				error: function (oError) {
					oThis._closeBusyFragment();
				}
			});

		},

		/**
		 * Gets the default request
		 * @function
		 * @param sFragmentName type string, name of the fragment
		 * @private 
		 */
		_prepareSidebarData: function (oData) {
			var oViewModel = this.getModel("candidateProcessModel");
			var oSidebarData = oViewModel.getProperty("/SidebarData");
			var oProcess = oViewModel.getProperty("/CandidateProcess");

			oSidebarData.visible = true;

			/*Candidate Data*/
			oSidebarData.candidateInfo.ImageSource = "/sap/opu/odata/sap/ZHCM_RECRUITMENT_SRV/CandidateSet(Tclas='" + oData.Tclas +
				"',Pernr='" +
				oData.Pernr + "')/$value";
			oSidebarData.candidateInfo.Title = oData.CandidateProcess.Ename;
			oSidebarData.candidateInfo.Line3 = oData.CandidateProcess.Email;
			oSidebarData.candidateInfo.Line1 = oData.CandidateProcess.Pernr;
			oSidebarData.candidateInfo.Line2 = oData.CandidateProcess.Tclas === "A" ? this.getText("INTERNAL_APPLICANT") : this.getText(
				"EXTERNAL_APPLICANT");
			/*Candidate Data*/

			/*Process status Info*/
			oSidebarData.candidateStatusInfo.push({
				Label: "Süreç Durumu",
				Value: oData.CandidateProcess.Cansx
			}, {
				Label: "Süreç Alt Durumu",
				Value: oData.CandidateProcess.Cansy
			}, {
				Label: "İşe Alım Sorumlusu",
				Value: oData.EmployeeRequestForm.Erfoe
			});
			/*Process status Info*/

			/*Request Owner Data*/
			oSidebarData.requestOwnerInfo.ImageSource = "/sap/opu/odata/sap/ZHCM_RECRUITMENT_SRV/CandidateSet(Tclas='A',Pernr='" +
				oData.EmployeeRequestForm.Rqowp + "')/$value";
			oSidebarData.requestOwnerInfo.Id = oData.EmployeeRequestForm.Rqowp;
			oSidebarData.requestOwnerInfo.Title = oData.EmployeeRequestForm.Rqowe;
			oSidebarData.requestOwnerInfo.Line1 = oData.EmployeeRequestForm.Rqowp;
			oSidebarData.requestOwnerInfo.Line2 = oData.EmployeeRequestForm.Rqopx;
			oSidebarData.requestOwnerInfo.Line3 = oData.EmployeeRequestForm.Rqoox;
			/*Request Owner Data*/

			/*Status Data*/
			oSidebarData.requestStatusInfo = [];
			oSidebarData.requestStatusInfo.push({
				Label: "Talep Numarası",
				Value: oData.EmployeeRequestForm.Erfno
			}, {
				Label: "Pozisyon",
				Value: oData.EmployeeRequestForm.Plaft ? oData.EmployeeRequestForm.Plaft : oData.EmployeeRequestForm.Plstx
			}, {
				Label: "Durum",
				Value: oData.EmployeeRequestForm.Erfsy ? oData.EmployeeRequestForm.Erfsx + "-" + oData.EmployeeRequestForm.Erfsy : oData.EmployeeRequestForm
					.Erfsx
			}, {
				Label: "Talep Tarihi",
				Value: this._formatDate(oData.EmployeeRequestForm.Rqdat, oData.EmployeeRequestForm.Rqtim)
			});
			/*Status Data*/

			/*Navigation Data*/
			oSidebarData.navigationData = [{
				RowIid: 0,
				Name: this.getText("RECRUITMENT_PROCESS"),
				Icon: "sap-icon://process"
			}, {
				RowIid: 1,
				Name: this.getText("PROCESS_HISTORY"),
				Icon: "sap-icon://customer-history"
			}];
			var oAppSettings = SharedData.getApplicationSettings();

			if (!oAppSettings) {
				oAppSettings = {
					Edit: false
				};
			}

			if (oProcess.Cprso === "H01" || oProcess.Cprso === "H02" || oProcess.Cprso === "H08" || oProcess.Cprso === "H90" || oAppSettings.Edit) {
				oSidebarData.navigationData.push({
					RowIid: 2,
					Name: this.getText("CANDIDATE_PROCESS_SUMMARY"),
					Icon: "sap-icon://goalseek"
				});
			}
			/*Navigation Data*/

			oViewModel.setProperty("/SidebarData", oSidebarData);
		},
		_getFragment: function (sFragmentName) {
			var oFormFragment = this._formFragments[sFragmentName];

			if (oFormFragment) {
				return oFormFragment;
			}

			oFormFragment = sap.ui.xmlfragment("com.bmc.hcm.erf.fragment." + sFragmentName, this);

			this._formFragments[sFragmentName] = oFormFragment;
			return this._formFragments[sFragmentName];
		},
		_checkMaxParticipant: function (aParticipants) {
			try {
				if (aParticipants.length < 3) {
					return true;
				} else {
					return false;
				}
			} catch (oEx) {
				jQuery.sap.log.error(oEx);
				return true;
			}
		},
		_validateStartDate: function () {
			var oViewModel = this.getModel("candidateProcessModel");
			var sCandidatePlannedStartDate = oViewModel.getProperty("/CandidatePlannedStartDate");
			var sIsDate = false;
			sIsDate = _.isDate(sCandidatePlannedStartDate) && sCandidatePlannedStartDate !== "" && sCandidatePlannedStartDate !== null &&
				sCandidatePlannedStartDate !== undefined;

			if (sIsDate) {
				oViewModel.setProperty("/CandidateProcess/Plbeg", sCandidatePlannedStartDate);
			}
			return sIsDate;
		},
		_validatePrefferedName: function () {
			var oViewModel = this.getModel("candidateProcessModel");
			var sPrfnm = oViewModel.getProperty("/CandidateProcess/Prfnm");
			var sEname = oViewModel.getProperty("/CandidateProcess/Ename");
			var aEname = sEname.split(" ");

			if ((sPrfnm === "" || sPrfnm === null || sPrfnm === undefined) && aEname.length > 2) {
				return false;
			} else {
				return true;
			}

		},
		_validateInterviewForm: function (sHR) {
			var oViewModel = this.getModel("candidateProcessModel");
			var aForms = oViewModel.getProperty("/CandidateInterviewOperation/CandidateInterviewFormSet");
			var oPlan = oViewModel.getProperty("/CandidateInterviewPlan");
			var sValid = true;

			if (sHR) {
				if (oPlan.IntntHr === "" || !oPlan.IntntHr) {
					return false;
				}
			} else {
				if (oPlan.IntntDp === "" || !oPlan.IntntDp) {
					return false;
				}
			}

			$.each(aForms, function (sKey, oForm) {
				$.each(oForm.CandidateInterviewQuestionsSet, function (sIndex, oQuestion) {
					if (sHR) {
						if (oQuestion.AnswerHr === "0" || oQuestion.AnswerHr === "" || !oQuestion.AnswerHr) {
							sValid = false;
							return false;
						}
					} else {
						if (oQuestion.AnswerDp === "0" || oQuestion.AnswerDp === "" || !oQuestion.AnswerDp) {
							sValid = false;
							return false;
						}
					}
				});
				if (!sValid) {
					return false;
				}
			});

			return sValid;
		}

	});

});