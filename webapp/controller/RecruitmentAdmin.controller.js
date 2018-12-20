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
		actionCatalog: [{
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
			}, {
				Text: "ASSIGN_TO_ACTION",
				Icon: "sap-icon://activity-assigned-to-goal",
				Action: "Assign",
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
			var oViewModel,
				iOriginalBusyDelay,
				oTable = this.byId("idRecAdmEmployeeRequestTable");

			// Put down requestList table's original value for busy indicator delay,
			// so it can be restored later on. Busy handling on the table is
			// taken care of by the table itself.
			iOriginalBusyDelay = oTable.getBusyIndicatorDelay();

			// keeps the search state
			this._aTableSearchState = [];

			// Model used to manipulate control states
			oViewModel = new JSONModel({});

			this.setModel(oViewModel, "recruitmentAdminModel");

			// Make sure, busy indication is showing immediately so there is no
			// break after the busy indication for loading the view's meta data is
			// ended (see promise 'oWhenMetadataIsLoaded' in AppController)
			oTable.attachEventOnce("updateFinished", function () {
				// Restore original busy indicator delay for requestList's table
				oViewModel.setProperty("/tableBusyDelay", iOriginalBusyDelay);
			});

			var oModel = this.getOwnerComponent().getModel();

			oModel.metadataLoaded().then(function () {});

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
		/**
		 * Triggered by the table's 'updateFinished' event: after new table
		 * data is available, this handler method updates the table counter.
		 * This should only happen if the update was successful, which is
		 * why this handler is attached to 'updateFinished' and not to the
		 * table's list binding's 'dataReceived' method.
		 * @param {sap.ui.base.Event} oEvent the update finished event
		 * @public
		 */
		onUpdateFinished: function (oEvent) {
			// update the requestList's object counter after the table update
			var oViewModel = this.getModel("recruitmentAdminModel"),
				oModel = this.getModel();

			oViewModel.setProperty("/busy", false);
			// only update the counter if the length is final and
			// the table is not empty
			//Refresh filter statistics async
			this._updateFilterCounts(oModel);

		},
		/**
		 * Triggered by the table's 'updateStarted' event: after new table
		 * data is available, this handler method updates the table counter.
		 * This should only happen if the update was successful, which is
		 * why this handler is attached to 'updateFinished' and not to the
		 * table's list binding's 'dataReceived' method.
		 * @param {sap.ui.base.Event} oEvent the update finished event
		 * @public
		 */
		onUpdateStarted: function (oEvent) {
			// update the requestList's object counter after the table update
			var oViewModel = this.getModel("recruitmentAdminModel");

			oViewModel.setProperty("/busy", true);
		},

		onPress: function (oEvent) {
			// The source is the list item that got pressed
			var oSource = oEvent.getSource();
			var oData = this.getModel().getProperty(oSource.getBindingContextPath());
			if (oData) {
				this._openRequestActions(oData, oSource);
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

		onCheckActionAvailable: function (sErfsf) {
			var oStatus = _.filter(this.actionCatalog, ["Status", sErfsf]);
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
			case "Assign":
				/*Set application settings*/

				var _assignConfirmed = function () {
					oThis._assignRequest(oFormData.Erfid, "ME", function () {
						oThis.onRefresh();
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

		onSearch: function (oEvent) {
			var oIconTabBar = this.byId("idRecAdmIconTab");
			var aActiveFilter = [];

			if (oEvent.getParameters().refreshButtonPressed) {
				// Search field's 'refresh' button has been pressed.
				// This is visible if you select any master list item.
				// In this case no new search is triggered, we only
				// refresh the list binding.
				this.onRefresh();
			} else {
				var sQuery = oEvent.getParameter("query");
				aActiveFilter = this._getActiveFilters(oIconTabBar.getSelectedKey());
				if (sQuery && sQuery.length > 0) {
					aActiveFilter.push(new Filter("Plans", FilterOperator.EQ, sQuery));
				}
				this._applySearch(aActiveFilter);
			}
		},
		onChangeFormStatusConfirmed: function () {
			var oViewModel = this.getModel("recruitmentAdminModel");
			var oChangeStatus = oViewModel.getProperty("/formChangeStatus");

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
			oFormData.Actio = "ADMIN_CHANGE_STATUS";
			oFormData.ErfstN = aStatus[0];
			oFormData.ErfssN = aStatus[1] ? aStatus[1] : "";
			this._updateRequest(oFormData, false, false, true, null);
		},
		onChangeFormStatusCancelled: function () {
			this._requestChangeStatus.data("formData", null);
			this._requestChangeStatus.close();
		},
		/**
		 * Event handler for refresh event. Keeps filter, sort
		 * and group settings and refreshes the list binding.
		 * @public
		 */
		onRefresh: function () {
			var oTable = this.byId("idRecAdmEmployeeRequestTable");
			oTable.getBinding("items").refresh();
		},

		/* =========================================================== */
		/* internal methods                                            */
		/* =========================================================== */

		_onRecruitmentAdminMatched: function (oEvent) {
			this.onRefresh();
		},

		/**
		 * Internal helper method to apply both filter and search state together on the list binding
		 * @param {sap.ui.model.Filter[]} aTableSearchState An array of filters for the search
		 * @private
		 */
		_initiateModels: function () {
			var oViewModel = this.getModel("recruitmentAdminModel");

			oViewModel.setData({
				requestListTableTitle: "",
				tableNoDataText: this.getText("EMPTY_REQUEST_LIST"),
				tableBusyDelay: 0,
				busy: false,
				searchResults: {
					"ERF": 0,
					"CPR": 0
				},
				formChangeStatus: {
					CurrentStatus: "",
					TargetStatus: "",
					StatusChangeNote: ""
				},
				formStatusList: []
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
		_updateFilterCounts: function (oModel) {
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
		_adjustRequestActions: function (oData) {
			var oViewModel = this.getModel("recruitmentAdminModel");
			oViewModel.setProperty("/requestActions", []);

			var oStatus = _.filter(this.actionCatalog, ["Status", oData["Erfsf"]]);

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