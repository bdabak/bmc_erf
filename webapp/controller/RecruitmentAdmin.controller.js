/*global location history */
/*global _*/
sap.ui.define([
	"com/bmc/hcm/erf/controller/BaseController",
	"com/bmc/hcm/erf/controller/SharedData",
	"sap/ui/model/json/JSONModel",
	"sap/ui/core/routing/History",
	"com/bmc/hcm/erf/model/formatter",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/m/MessageBox",
	"sap/m/MessageToast"
], function (BaseController, SharedData, JSONModel, History, formatter, Filter, FilterOperator, MessageBox, MessageToast) {
	"use strict";

	return BaseController.extend("com.bmc.hcm.erf.controller.RecruitmentAdmin", {

		formatter: formatter,
		defaultFilters: [
			new Filter("Erfap", FilterOperator.EQ, "REQUEST_LIST_ADMIN"),
			new Filter("Erfsf", FilterOperator.EQ, "ALL")
		],
		processActionCatalog: [
			// BEG	Süreç Başlangıcı
			// INH	İK Mülakatı
			// IND	Bölüm Mülakatı
			// RFC	Referans Kontrolü
			// CAP	Aday Onayı
			// PAY	Ücret Çalışması
			// OFF	Teklif Aşaması
			// DOC	Evrak Kontrolü
			// CMP	Onaylandı
			// REJ	Reddedildi
			{
				Status: ["BEG"],
				AvailableActions: [{
					Text: "DISPLAY_RESUME",
					Icon: "sap-icon://pdf-attachment",
					Action: "PrintResume",
					Type: "Default"
				}, {
					Text: "EDIT_ACTION",
					Icon: "sap-icon://edit",
					Action: "EditProcess",
					Type: "Default"
				}, {
					Text: "UNASSIGN_CANDIDATE",
					Icon: "sap-icon://disconnected",
					Action: "DeleteProcess",
					Type: "Reject"
				}]
			}, {
				Status: ["INH", "IND", "RFC", "CAP", "PAY", "OFF", "DOC", "CMP", "REJ"],
				AvailableActions: [{
					Text: "DISPLAY_RESUME",
					Icon: "sap-icon://pdf-attachment",
					Action: "PrintResume",
					Type: "Default"
				}, {
					Text: "EDIT_ACTION",
					Icon: "sap-icon://edit",
					Action: "EditProcess",
					Type: "Default"
				}]
			}

		],
		requestActionCatalog: [{
			Status: "DRF",
			AvailableActions: [{
				Text: "PRINT_OUT_ACTION",
				Icon: "sap-icon://pdf-attachment",
				Action: "PrintOut",
				Type: "Default"
			}]
		}, {
			Status: "CMP",
			AvailableActions: [{
				Text: "CHANGE_STATUS",
				Icon: "sap-icon://shortcut",
				Action: "ChangeStatus",
				Type: "Emphasized"
			}, {
				Text: "PRINT_OUT_ACTION",
				Icon: "sap-icon://pdf-attachment",
				Action: "PrintOut",
				Type: "Default"
			}]
		}, {
			Status: "PND",
			AvailableActions: [{
				Text: "CHANGE_STATUS_ACTION",
				Icon: "sap-icon://shortcut",
				Action: "ChangeStatus",
				Type: "Accept"
			}, {
				Text: "CHANGE_APPROVER_ACTION",
				Icon: "sap-icon://switch-classes",
				Action: "ChangeApprover",
				Type: "Accept"
			}, {
				Text: "DISPLAY_ACTION",
				Icon: "sap-icon://display",
				Action: "Display",
				Type: "Default"
			}, {
				Text: "PRINT_OUT_ACTION",
				Icon: "sap-icon://pdf-attachment",
				Action: "PrintOut",
				Type: "Default"
			}, {
				Text: "DELETE_ACTION",
				Icon: "sap-icon://delete",
				Action: "Delete",
				Type: "Reject"
			}]
		}, {
			Status: "APP",
			AvailableActions: [{
				Text: "CHANGE_STATUS_ACTION",
				Icon: "sap-icon://shortcut",
				Action: "ChangeStatus",
				Type: "Accept"
			}, {
				Text: "ASSIGN_TO_RECRUITER",
				Icon: "sap-icon://activity-assigned-to-goal",
				Action: "AssignTo",
				Type: "Accept"
			}, {
				Text: "DISPLAY_ACTION",
				Icon: "sap-icon://display",
				Action: "Display",
				Type: "Default"
			}, {
				Text: "PRINT_OUT_ACTION",
				Icon: "sap-icon://pdf-attachment",
				Action: "PrintOut",
				Type: "Default"
			}]
		}, {
			Status: "REJ",
			AvailableActions: [{
				Text: "CHANGE_STATUS",
				Icon: "sap-icon://shortcut",
				Action: "ChangeStatus",
				Type: "Emphasized"
			}, {
				Text: "DISPLAY_ACTION",
				Icon: "sap-icon://display",
				Action: "Display",
				Type: "Default"
			}, {
				Text: "PRINT_OUT_ACTION",
				Icon: "sap-icon://pdf-attachment",
				Action: "PrintOut",
				Type: "Default"
			}]
		}],
		/* =========================================================== */
		/* lifecycle methods                                           */
		/* =========================================================== */

		/**
		 * Called when the requestlist controller is instantiated.
		 * @public
		 */
		onInit: function () {
			var oViewModel = new JSONModel({});

			this.setModel(oViewModel, "recruitmentAdminModel");

			this.getRouter().getRoute("recruitmentadmin").attachPatternMatched(this._onRecruitmentAdminMatched, this);

			document.addEventListener("backbutton", this.onExit.bind(this), false);

			this.initOperations();
		},

		onExit: function () {
			this._initiateModels();
		},

		/* =========================================================== */
		/* event handlers                                              */
		/* =========================================================== */
		onNavBack: function () {
			this._initiateModels();
			this.goBack(History);
		},
		onRequestUpdateFinished: function (oEvent) {
			// update the requestList's object counter after the table update
			var oViewModel = this.getModel("recruitmentAdminModel"),
				oModel = this.getModel();

			oViewModel.setProperty("/busyRequest", false);
			// only update the counter if the length is final and
			// the table is not empty
			//Refresh filter statistics async
			this._updateRequestFilterCounts(oModel);
		},
		onRequestUpdateStarted: function (oEvent) {
			// update the requestList's object counter after the table update
			var oViewModel = this.getModel("recruitmentAdminModel");

			oViewModel.setProperty("/busyRequest", true);
		},

		onRequestPress: function (oEvent) {
			// The source is the list item that got pressed
			var oSource = oEvent.getSource();
			var oData = this.getModel().getProperty(oSource.getBindingContextPath());
			if (oData) {
				this._openRequestActions(oData, oSource);
			}
		},

		onProcessPress: function (oEvent) {
			// The source is the list item that got pressed
			var oSource = oEvent.getSource();
			var oViewModel = this.getModel("recruitmentAdminModel");
			var oData = oViewModel.getProperty(oSource.getBindingContextPath());
			if (oData) {
				this._openProcessActions(oData, oSource);
			}
		},

		onAvailableRequestActions: function (oEvent) {
			var oSource = oEvent.getSource();
			var oData = this.getModel().getProperty(oSource.getParent().getBindingContextPath());
			if (oData) {
				this._openRequestActions(oData, oSource);
			}
		},
		onGetText: function (sTextCode) {
			return this.getText(sTextCode);
		},

		onCheckActionAvailable: function (sErfsf) {
			var oStatus = _.filter(this.requestActionCatalog, ["Status", sErfsf]);
			if (oStatus.length === 1) {
				if (oStatus[0].hasOwnProperty("AvailableActions")) {
					return true;
				} else {
					return false;
				}
			} else {
				return false;
			}
		},

		onRequestActionSelected: function (oEvent) {
			var oSource = oEvent.getSource();
			var sAction = oSource.data("actionId");
			var oFormData = oSource.getParent().data("formData");
			var oThis = this;
			var oBeginButtonProp = {};
			var oApplicationSettings = {};
			var oViewModel = this.getModel("recruitmentAdminModel");

			switch (sAction) {
			case "ChangeStatus":
				var _doCallChangeStatus = function () {
					oThis._openFormChangeStatus(oFormData);
				};
				this._getFormStatusList(oFormData, _doCallChangeStatus.bind(oThis));
				break;
			case "ChangeApprover":
				oViewModel.setProperty("/changeApproverAction", {
					CurrentApprover: oFormData.Fronp,
					CurrentApproverName: oFormData.Frone,
					TargetApprover: "",
					TargetApproverName: ""
				});
				oThis._openFormChangeApprover(oFormData);

				break;
			case "Edit":
				/*Set application settings*/
				oApplicationSettings.Edit = true;
				oApplicationSettings.CallerRole = this.callerRole;
				if (this.callerRole === "RECRUITER") {
					oApplicationSettings.Edit = false;
				}
				SharedData.setApplicationSettings(oApplicationSettings);
				/*Set request data*/
				SharedData.setCurrentRequest(oFormData);
				oViewModel.setProperty("/busy", true);
				this.getRouter().navTo("employeerequestedit", {
					Erfid: oFormData.Erfid
				});
				break;
			case "Display":
				/*Set application settings*/
				oApplicationSettings.Edit = false;
				oApplicationSettings.CallerRole = this.callerRole;
				SharedData.setApplicationSettings(oApplicationSettings);
				/*Set request data*/
				SharedData.setCurrentRequest(oFormData);
				oViewModel.setProperty("/busy", true);
				this.getRouter().navTo("employeerequestedit", {
					Erfid: oFormData.Erfid
				});
				break;
			case "AssignTo":
				var _doCallChangeRecruiter = function () {
					oThis._openFormChangeRecruiter(oFormData);
				};
				this._getRecruiterList(oFormData, _doCallChangeRecruiter.bind(oThis));
				break;
			case "Assign":
				/*Set application settings*/

				var _assignConfirmed = function () {
					oThis._assignRequest(oFormData.Erfid, "ME", function () {
						oThis.onRequestRefresh();
					});
				};

				oBeginButtonProp = {
					text: this.getText("ASSIGN_ACTION"),
					type: "Accept",
					icon: "sap-icon://activity-assigned-to-goal",
					onPressed: _assignConfirmed
				};

				this._callConfirmDialog(this.getText("CONFIRMATION_REQUIRED"), "Message", "Warning", this.getText("FORM_ASSIGN_CONFIRMATION"),
					oBeginButtonProp, null).open();

				break;
			case "Delete":
				var _deleteConfirmed = function () {
					oThis._deleteRequest(oFormData.Erfid);
				};

				oBeginButtonProp = {
					text: this.getText("DELETE_ACTION"),
					type: "Reject",
					icon: "sap-icon://delete",
					onPressed: _deleteConfirmed
				};

				this._callConfirmDialog(this.getText("CONFIRMATION_REQUIRED"), "Message", "Warning", this.getText("FORM_DELETE_CONFIRMATION"),
					oBeginButtonProp, null).open();

				break;
			case "PrintOut":
				var sPrintOutPath = "/sap/opu/odata/sap/ZHCM_RECRUITMENT_SRV/EmployeeRequestFormSet('" +
					oFormData.Erfid + "')/EmployeeRequestPrintOut/$value";
				var sPlstx = oFormData.Nopln ? oFormData.Plaft : oFormData.Plstx;
				var sPrintOutTitle = this.getText("REQUEST_PRINT_OUT_TITLE", [sPlstx]);

				this._callPDFViewer(sPrintOutPath, sPrintOutTitle);

				break;
			}
		},
		onProcessActionSelected: function (oEvent) {
			var oSource = oEvent.getSource();
			var sAction = oSource.data("actionId");
			var oFormData = oSource.getParent().data("formData");
			var oApplicationSettings = {};

			switch (sAction) {
			case "PrintResume":

				break;
			case "EditProcess":

				oApplicationSettings.Edit = true;
				oApplicationSettings.CallerRole = this.callerRole;
				SharedData.setApplicationSettings(oApplicationSettings);

				SharedData.setCandidateProcess({
					"Erfid": oFormData.Erfid,
					"Tclas": oFormData.Tclas,
					"Pernr": oFormData.Pernr
				});

				this.getRouter().navTo("candidateprocess");

				break;
			case "DeleteProcess":

				break;

			}
		},

		onRequestSearch: function (oEvent) {
			var oIconTabBar = this.byId("idRecAdmIconTab");
			var aActiveFilter = [];

			if (oEvent.getParameters().refreshButtonPressed) {
				// Search field's 'refresh' button has been pressed.
				// This is visible if you select any master list item.
				// In this case no new search is triggered, we only
				// refresh the list binding.
				this.onRequestRefresh();
			} else {
				var sQuery = oEvent.getParameter("query");
				aActiveFilter = this._getActiveFilters(oIconTabBar.getSelectedKey());
				if (sQuery && sQuery.length > 0) {
					aActiveFilter.push(new Filter("Plans", FilterOperator.EQ, sQuery));
				}
				this._applySearch(aActiveFilter);
			}
		},
		onChangeFormApproverConfirmed: function () {
			var oViewModel = this.getModel("recruitmentAdminModel");
			var oChangeApprover = oViewModel.getProperty("/changeApproverAction");
			var oFormData = this._requestChangeApprover.data("formData");
			var oModel = this.getModel();
			var oThis = this;

			if (oChangeApprover.TargetApprover === "" || oChangeApprover.TargetApprover === null) {
				MessageToast.show("Sürecin yönlendirileceği kişiyi seçmelisiniz!");
				return;
			}

			var oUrlParameters = {
				"Erfid": oFormData.Erfid,
				"Pernr": oChangeApprover.TargetApprover
			};

			oViewModel.setProperty("/busy", true);

			oModel.callFunction("/SetEmpReqApprover", {
				method: "POST",
				urlParameters: oUrlParameters,
				success: function (oData, oResponse) {
					oViewModel.setProperty("/busy", false);
					if (oData.Type !== "E") {
						MessageBox.success(oThis.getText("PROCESS_REDIRECTED"));
					} else {
						MessageBox.error(oThis.getText("ERROR_OCCURED", [oData.Message]));
					}
					oThis.onRequestRefresh();
					oThis._requestChangeApprover.data("formData", null);
					oThis._requestChangeApprover.close();

				},
				error: function (oError) {
					oViewModel.setProperty("/busy", false);
					oThis._requestChangeApprover.data("formData", null);
					oThis._requestChangeApprover.close();
				}
			});

		},
		onChangeFormApproverCancelled: function () {
			this._requestChangeApprover.data("formData", null);
			this._requestChangeApprover.close();
		},
		onChangeFormStatusConfirmed: function () {
			var oViewModel = this.getModel("recruitmentAdminModel");
			var oChangeStatus = oViewModel.getProperty("/formChangeStatus");
			var oThis = this;

			if (oChangeStatus.TargetStatus === "" || oChangeStatus.TargetStatus === null) {
				MessageToast.show("Hedef durumu girmelisiniz!");
				return;
			}

			if (oChangeStatus.StatusChangeNote === "" || oChangeStatus.StatusChangeNote === null) {
				MessageToast.show("Durum değişiklik nedeni girmelisiniz!");
				return;
			}

			var oFormData = _.cloneDeep(this._requestChangeStatus.data("formData"));
			var aStatus = oChangeStatus.TargetStatus.split("-");
			oFormData.Actio = "ADMIN_CHSTA";
			oFormData.ErfstN = aStatus[0];
			oFormData.ErfssN = aStatus[1] ? aStatus[1] : "";
			oFormData.Stcnt = oChangeStatus.StatusChangeNote;
			var _doStatusChanged = function () {
				oThis.onRequestRefresh();
			};

			this._requestChangeStatus.data("formData", null);
			this._requestChangeStatus.close();
			this._updateRequest(oFormData, false, false, true, null, _doStatusChanged);
		},
		onChangeFormStatusCancelled: function () {
			this._requestChangeStatus.data("formData", null);
			this._requestChangeStatus.close();
		},
		onChangeFormRecruiterConfirmed: function () {
			var oViewModel = this.getModel("recruitmentAdminModel");
			var oChangeRecruiter = oViewModel.getProperty("/changeRecruiterAction");
			var oThis = this;

			if (oChangeRecruiter.TargetRecruiter === "" || oChangeRecruiter.TargetRecruiter === null) {
				MessageToast.show("Yeni İşe Alım Uzmanını seçmelisiniz!");
				return;
			}

			var oFormData = _.cloneDeep(this._requestChangeRecruiter.data("formData"));

			oThis._assignRequest(oFormData.Erfid, oChangeRecruiter.TargetRecruiter, function () {
				oThis._requestChangeRecruiter.data("formData", null);
				oThis._requestChangeRecruiter.close();
				oThis.onRequestRefresh();
			});
		},
		onChangeFormRecruiterCancelled: function () {
			this._requestChangeRecruiter.data("formData", null);
			this._requestChangeRecruiter.close();
		},

		onRequestRefresh: function () {
			var oTable = this.byId("idRecAdmEmployeeRequestTable");
			oTable.getBinding("items").refresh();
		},

		onProcessRefresh: function () {
			var oViewModel = this.getModel("recruitmentAdminModel");
			var oModel = this.getModel();
			var oThis = this;

			oViewModel.setProperty("/processList", []);

			var sQuery = "/CandidateProcessOperationsSet";

			var sExpand = "EmployeeRequestForm,CandidateProcess";

			//aFilters.push(new Filter("Actio", FilterOperator.EQ, "GET"));
			oViewModel.setProperty("/busyProcess", true);
			oModel.read(sQuery, {
				urlParameters: {
					"$expand": sExpand
				},
				success: function (oData, oResponse) {
					var aProcess = [];
					oViewModel.setProperty("/busyProcess", false);
					$.each(oData.results, function (sIndex, oLine) {
						var oProcess = {};
						oProcess.Erfno = _.clone(oLine.EmployeeRequestForm.Erfno);
						oProcess.Rqowe = _.clone(oLine.EmployeeRequestForm.Rqowe);
						oProcess.Plstx = _.clone(oLine.EmployeeRequestForm.Plstx || oLine.EmployeeRequestForm.Plaft);
						oProcess = _.assignIn(oProcess, _.cloneDeep(oLine.CandidateProcess));

						oProcess.ChartData = [{
							data: [oProcess.Perct, 100 - oProcess.Perct],
							backgroundColor: oProcess.Perct < 33 ? [
								"#ff6384",
								"#e0e0e0"
							] : oProcess.Perct < 66 ? [
								"#e78c07",
								"#e0e0e0"
							] : [
								"#2b7d2b",
								"#e0e0e0"
							]
						}];
						oProcess.ActionList = oThis._adjustProcessActions(oProcess);
						aProcess.push(oProcess);
					});
					oViewModel.setProperty("/processList", aProcess);
				},
				error: function (oError) {
					oViewModel.setProperty("/busyProcess", false);
				}
			});
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
			var oViewModel = this.getModel("recruitmentAdminModel");
			var sSourceField = this._employeeValueHelpDialog.data("sourceField");
			var sTextField = "";

			if (oSelectedObject) {
				switch (sSourceField) {
				case "TargetApprover":
					sTextField = "TargetApproverName";
					break;
				default:
					jQuery.sap.log.error("Source field not supplied!");
					return;
				}
				oViewModel.setProperty("/changeApproverAction/" + sSourceField, oSelectedObject.Pernr);
				oViewModel.setProperty("/changeApproverAction/" + sTextField, oSelectedObject.Ename);
			}
			oEvent.getSource().getBinding("items").filter([]);
			oEvent.getSource().getBinding("items").refresh();
			this._employeeValueHelpDialog.setRememberSelections(false);
			this._employeeValueHelpDialog.data("sourceField", null);
			this._employeeValueHelpDialog.data("includeInactive", false);
		},
		onResetEmployee: function (oEvent) {
			var oViewModel = this.getModel("recruitmentAdminModel");
			var sSourceField = oEvent.getSource().data("sourceField");
			var sTextField = "";

			switch (sSourceField) {
			case "TargetApprover":
				sTextField = "TargetApproverName";
				break;
			default:
				jQuery.sap.log.error("Source field not supplied!");
				return;
			}

			oViewModel.setProperty("/changeApproverAction/" + sSourceField, "00000000");
			oViewModel.setProperty("/changeApproverAction/" + sTextField, "");
		},
		/* =========================================================== */
		/* internal methods                                            */
		/* =========================================================== */
		_onRecruitmentAdminMatched: function (oEvent) {
			this.callerRole = "RECRUITMENT_ADMIN";
			this.onRequestRefresh();
			this.onProcessRefresh();
		},
		_openRequestActions: function (oData, oSource) {
			if (this._adjustRequestActions(oData)) {
				if (!this._requestActions) {
					this._requestActions = sap.ui.xmlfragment(
						"com.bmc.hcm.erf.fragment.RequestAdminActions",
						this
					);
					this.getView().addDependent(this._requestActions);
				}
				this._requestActions.data("formData", oData);
				this._requestActions.openBy(oSource);
			} else {
				this._callMessageToast(this.getText("NO_ACTIONS_DEFINED"), "W");
			}
		},
		_openProcessActions: function (oData, oSource) {
			if (this._adjustProcessActions(oData)) {
				if (!this._processActions) {
					this._processActions = sap.ui.xmlfragment(
						"com.bmc.hcm.erf.fragment.ProcessAdminActions",
						this
					);
					this.getView().addDependent(this._processActions);
				}
				this._processActions.data("formData", oData);
				this._processActions.openBy(oSource);
			} else {
				this._callMessageToast(this.getText("NO_ACTIONS_DEFINED"), "W");
			}
		},
		_openFormChangeStatus: function (oData) {
			if (!this._requestChangeStatus) {
				this._requestChangeStatus = sap.ui.xmlfragment(
					"com.bmc.hcm.erf.fragment.EmployeeRequestChangeStatus",
					this
				);
				this.getView().addDependent(this._requestChangeStatus);
			}
			this._requestChangeStatus.data("formData", oData);
			this._requestChangeStatus.open();
		},
		_openFormChangeRecruiter: function (oData) {
			if (!this._requestChangeRecruiter) {
				this._requestChangeRecruiter = sap.ui.xmlfragment(
					"com.bmc.hcm.erf.fragment.EmployeeRequestAssignRecruiter",
					this
				);
				this.getView().addDependent(this._requestChangeRecruiter);
			}
			this._requestChangeRecruiter.data("formData", oData);
			this._requestChangeRecruiter.open();
		},
		_openFormChangeApprover: function (oData) {
			if (!this._requestChangeApprover) {
				this._requestChangeApprover = sap.ui.xmlfragment(
					"com.bmc.hcm.erf.fragment.EmployeeRequestChangeApprover",
					this
				);
				this.getView().addDependent(this._requestChangeApprover);
			}
			this._requestChangeApprover.data("formData", oData);
			this._requestChangeApprover.open();
		},
		_initiateModels: function () {
			var oViewModel = this.getModel("recruitmentAdminModel");

			oViewModel.setData({
				requestListTableTitle: "",
				tableNoDataText: this.getText("EMPTY_REQUEST_LIST"),
				tableBusyDelay: 0,
				busy: false,
				busyRequest: false,
				busyProcess: false,
				searchResults: {
					"ERF": 0,
					"CPR": 0
				},
				formChangeStatus: {
					CurrentStatus: "",
					TargetStatus: "",
					StatusChangeNote: ""
				},
				changeApproverAction: {
					CurrentApprover: "",
					CurrentApproverName: "",
					TargetApprover: "",
					TargetApproverName: ""
				},
				changeRecruiterAction: {
					CurrentRecruiter: "",
					CurrentRecruiterName: "",
					TargetRecruiter: "",
					TargetRecruiterName: ""
				},
				formStatusList: [],
				recruiterList: [],
				processList: [],
				requestActions: [],
				processActions: []
			});
		},
		_applySearch: function (aTableSearchState) {
			var oTable = this.byId("idRecAdmEmployeeRequestTable"),
				oViewModel = this.getModel("recruitmentAdminModel");
			oTable.getBinding("items").filter(aTableSearchState, "Application");
			// changes the noDataText of the list in case there are no filter results
			if (aTableSearchState.length !== 0) {
				oViewModel.setProperty("/tableNoDataText", this.getText("EMPTY_REQUEST_LIST_SEARCH"));
			}
		},
		_getFormStatusList: function (oRequest, fnCallBack) {
			var oModel = this.getModel();
			var oViewModel = this.getModel("recruitmentAdminModel");

			oViewModel.setProperty("/formStatusList", []);
			oViewModel.setProperty("/busy", true);
			oViewModel.setProperty("/formChangeStatus", {
				CurrentStatus: oRequest.Erfsy ? oRequest.Erfsx + "-" + oRequest.Erfsy : oRequest.Erfsx,
				TargetStatus: "",
				StatusChangeNote: ""
			});
			var aFilters = [
				new Filter("Selky", FilterOperator.EQ, oRequest.Erfid),
				new Filter("Erfvh", FilterOperator.EQ, "RequestStatus")
			];
			oModel.read("/ValueHelpSet", {
				filters: aFilters,
				success: function (oData, oResponse) {
					oViewModel.setProperty("/busy", false);
					oViewModel.setProperty("/formStatusList", oData.results);
					fnCallBack();
				},
				error: function (oError) {
					oViewModel.setProperty("/busy", false);
					MessageBox.warning("Durum değişiklik listesi okunamadı");
				}
			});

		},
		_getRecruiterList: function (oRequest, fnCallBack) {
			var oModel = this.getModel();
			var oViewModel = this.getModel("recruitmentAdminModel");

			oViewModel.setProperty("/recruiterList", []);
			oViewModel.setProperty("/busy", true);
			oViewModel.setProperty("/changeRecruiterAction", {
				CurrentRecruiter: oRequest.Erfow,
				CurrentRecruiterName: oRequest.Erfoe,
				TargetRecruiter: "",
				TargetRecruiterName: ""
			});
			var aFilters = [
				new Filter("Selky", FilterOperator.EQ, oRequest.Erfow),
				new Filter("Erfvh", FilterOperator.EQ, "Recruiters")
			];
			oModel.read("/ValueHelpSet", {
				filters: aFilters,
				success: function (oData, oResponse) {
					oViewModel.setProperty("/busy", false);
					oViewModel.setProperty("/recruiterList", oData.results);
					fnCallBack();
				},
				error: function (oError) {
					oViewModel.setProperty("/busy", false);
					MessageBox.warning("İşe alım uzmanları okunamadı");
				}
			});

		},
		_updateRequestFilterCounts: function (oModel) {
			var oViewModel = this.getModel("recruitmentAdminModel");
			var oThis = this;
			oViewModel.setProperty("/searchResults/ERF", 0);
			oModel.read("/EmployeeRequestFormSet/$count", {
				filters: oThis.defaultFilters,
				success: function (oData, oResponse) {
					oViewModel.setProperty("/searchResults/ERF", oResponse.body);
				},
				error: function (oError) {

				}
			});

		},
		_adjustProcessActions: function (oData) {
			var oThis = this;
			var aActions = [];
			var oViewModel = this.getModel("recruitmentAdminModel");

			$.each(oThis.processActionCatalog, function (sIndex, oAction) {
				if (_.includes(oAction.Status, oData.Cansf)) {
					aActions = _.clone(oAction.AvailableActions);
					return false;
				}
			});

			oViewModel.setProperty("/processActions", aActions);

			return aActions.length > 0;

		},
		_adjustRequestActions: function (oData) {
			var oViewModel = this.getModel("recruitmentAdminModel");
			oViewModel.setProperty("/requestActions", []);

			var oStatus = _.filter(this.requestActionCatalog, ["Status", oData["Erfsf"]]);

			if (oStatus.length === 1) {
				if (oStatus[0].hasOwnProperty("AvailableActions")) {
					oViewModel.setProperty("/requestActions", oStatus[0].AvailableActions);
					return true;
				} else {
					return false;
				}
			} else {
				return false;
			}
		}

	});
});