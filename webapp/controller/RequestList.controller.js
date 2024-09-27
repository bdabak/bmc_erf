/*global location history */
/*global _*/
sap.ui.define([
	"com/bmc/hcm/erf/controller/BaseController",
	"com/bmc/hcm/erf/controller/SharedData",
	"sap/ui/model/json/JSONModel",
	"sap/ui/core/routing/History",
	"com/bmc/hcm/erf/model/formatter",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator"
], function (BaseController, SharedData, JSONModel, History, formatter, Filter, FilterOperator) {
	"use strict";

	return BaseController.extend("com.bmc.hcm.erf.controller.RequestList", {

		formatter: formatter,
		statusFilters: [],
		callerRole: null,
		allStatusFilters: {
			"MANAGER": {
				Statuses: [{
					Status: "DRF",
					Label: "DRAFT_REQUESTS_HEADER",
					AvailableActions: [{
						Text: "EDIT_ACTION",
						Icon: "sap-icon://edit",
						Action: "Edit",
						Type: "Emphasized"
					}, {
						Text: "DISPLAY_ACTION",
						Icon: "sap-icon://display",
						Action: "Display",
						Type: "Emphasized"
					}, {
						Text: "DELETE_ACTION",
						Icon: "sap-icon://delete",
						Action: "Delete",
						Type: "Reject"
					}, {
						Text: "PRINT_OUT_ACTION",
						Icon: "sap-icon://pdf-attachment",
						Action: "PrintOut",
						Type: "Default"
					}]
				}, {
					Status: "PND",
					Label: "PENDING_REQUESTS_HEADER",
					AvailableActions: [{
						Text: "DISPLAY_ACTION",
						Icon: "sap-icon://display",
						Action: "Display",
						Type: "Emphasized"
					}, {
						Text: "PRINT_OUT_ACTION",
						Icon: "sap-icon://pdf-attachment",
						Action: "PrintOut",
						Type: "Default"
					}]
				}, {
					Status: "APP",
					Label: "APPROVED_REQUESTS_HEADER",
					AvailableActions: [{
						Text: "DISPLAY_ACTION",
						Icon: "sap-icon://display",
						Action: "Display",
						Type: "Emphasized"
					}, {
						Text: "PRINT_OUT_ACTION",
						Icon: "sap-icon://pdf-attachment",
						Action: "PrintOut",
						Type: "Default"
					}]
				}, {
					Status: "REJ",
					Label: "REJECTED_REQUESTS_HEADER",
					AvailableActions: [{
						Text: "DISPLAY_ACTION",
						Icon: "sap-icon://display",
						Action: "Display",
						Type: "Emphasized"
					}, {
						Text: "PRINT_OUT_ACTION",
						Icon: "sap-icon://pdf-attachment",
						Action: "PrintOut",
						Type: "Default"
					}]
				}, {
					Status: "ALL",
					Label: "ALL_REQUESTS_HEADER"
				}],
				DefaultFilters: [
					new Filter("Erfap", FilterOperator.EQ, "MY_REQUESTS"),
					new Filter("Erfsf", FilterOperator.EQ, "DRF")
				]
			},
			"RECRUITER": {
				Statuses: [{
					Status: "APM",
					Label: "APPROVED_REQUESTS_ME_HEADER",
					DefaultStatus: ["APP"],
					AvailableActions: [{
						Text: "EDIT_ACTION",
						Icon: "sap-icon://edit",
						Action: "Edit",
						Type: "Emphasized"
					}, {
						Text: "PRINT_OUT_ACTION",
						Icon: "sap-icon://pdf-attachment",
						Action: "PrintOut",
						Type: "Default"
					}]
				}, {
					Status: "APF",
					Label: "APPROVED_REQUESTS_FR_HEADER",
					DefaultStatus: ["APP"],
					AvailableActions: [{
						Text: "DISPLAY_ACTION",
						Icon: "sap-icon://display",
						Action: "Display",
						Type: "Emphasized"
					}, {
						Text: "ASSIGN_ACTION",
						Icon: "sap-icon://activity-assigned-to-goal",
						Action: "Assign",
						Type: "Accept"
					}, {
						Text: "PRINT_OUT_ACTION",
						Icon: "sap-icon://pdf-attachment",
						Action: "PrintOut",
						Type: "Default"
					}]

				}, {
					Status: "APO",
					Label: "APPROVED_REQUESTS_OT_HEADER",
					DefaultStatus: ["APP"],
					AvailableActions: [{
						Text: "DISPLAY_ACTION",
						Icon: "sap-icon://display",
						Action: "Display",
						Type: "Emphasized"
					}, {
						Text: "PRINT_OUT_ACTION",
						Icon: "sap-icon://pdf-attachment",
						Action: "PrintOut",
						Type: "Default"
					}]
				}, {
					Status: "ALL",
					Label: "ALL_REQUESTS_HEADER",
					DefaultStatus: ["DRF", "PND", "APP", "REJ", "CMP"],
					AvailableActions: [{
						Text: "DISPLAY_ACTION",
						Icon: "sap-icon://display",
						Action: "Display",
						Type: "Emphasized"
					}, {
						Text: "PRINT_OUT_ACTION",
						Icon: "sap-icon://pdf-attachment",
						Action: "PrintOut",
						Type: "Default"
					}]
				}],
				DefaultFilters: [
					new Filter("Erfap", FilterOperator.EQ, "REQUESTS_APPROVED"),
					new Filter("Erfsf", FilterOperator.EQ, "APP"),
					new Filter("Erfrf", FilterOperator.EQ, "APM")
				]
			}
		},
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
				oTable = this.byId("idEmployeeRequestTable");

			// Put down requestList table's original value for busy indicator delay,
			// so it can be restored later on. Busy handling on the table is
			// taken care of by the table itself.
			iOriginalBusyDelay = oTable.getBusyIndicatorDelay();

			// keeps the search state
			this._aTableSearchState = [];

			// Model used to manipulate control states
			oViewModel = new JSONModel({
				requestListTableTitle: "",
				tableNoDataText: this.getText("EMPTY_REQUEST_LIST"),
				tableBusyDelay: 0,
				newRequestButtonVisible: false,
				busy: false,
				searchResults: {
					"DRF": 0,
					"PND": 0,
					"APP": 0,
					"REJ": 0,
					"ALL": 0,
					"APM": 0,
					"APF": 0,
					"APO": 0
				},
				filterText: "",
				statusFilters: [{
					"Erfsf": "DRF",
					"Erfsx": "Taslak",
					Selected: false
				}, {
					"Erfsf": "PND",
					"Erfsx": "Onay Devam Ediyor",
					Selected: false
				}, {
					"Erfsf": "APP",
					"Erfsx": "Onaylandı",
					Selected: false
				}, {
					"Erfsf": "REJ",
					"Erfsx": "Reddedildi",
					Selected: false
				}, {
					"Erfsf": "CMP",
					"Erfsx": "Kapatıldı",
					Selected: false
				}]

			});

			this.setModel(oViewModel, "requestListView");

			// Make sure, busy indication is showing immediately so there is no
			// break after the busy indication for loading the view's meta data is
			// ended (see promise 'oWhenMetadataIsLoaded' in AppController)
			oTable.attachEventOnce("updateFinished", function () {
				// Restore original busy indicator delay for requestList's table
				oViewModel.setProperty("/tableBusyDelay", iOriginalBusyDelay);
			});

			oViewModel.setProperty("/newRequestButtonVisible", false);

			var oModel = this.getOwnerComponent().getModel();

			oModel.metadataLoaded().then(function () {
				//Get authorization for new request
				oViewModel.setProperty("/newRequestButtonVisible", SharedData.getCurrentUser().IsautErfoa);
				oViewModel.refresh();
			});

			this.getRouter().getRoute("mngrequestlist").attachPatternMatched(this._onManagerRequestListMatched, this);
			this.getRouter().getRoute("recrequestlist").attachPatternMatched(this._onRecruiterRequestListMatched, this);
			document.addEventListener("backbutton", this.onExit.bind(this), false);

			this.initOperations();
		},

		onExit: function () {
			this.statusFilters = [];
			this.callerRole = null;
		},

		/* =========================================================== */
		/* event handlers                                              */
		/* =========================================================== */
		onNavBack: function () {
			this.statusFilters = [];
			this.callerRole = null;
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
			var sTitle,
				oViewModel = this.getModel("requestListView"),
				oIconTabBar = this.byId("idIconTabBar"),
				oModel = this.getModel();

			oViewModel.setProperty("/busy", false);
			// only update the counter if the length is final and
			// the table is not empty

			var aActiveFilter = [];

			aActiveFilter = _.filter(this.statusFilters, ["Status", oIconTabBar.getSelectedKey()]);

			if (!aActiveFilter[0]) {
				aActiveFilter = _.take(this.statusFilters, 1);
			}

			if (aActiveFilter[0]) {
				sTitle = this.getText(aActiveFilter[0].Label);
				this.getModel("requestListView").setProperty("/requestListTableTitle", sTitle);
			}

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
			var oViewModel = this.getModel("requestListView");

			oViewModel.setProperty("/busy", true);
		},

		/**
		 * Event handler when a table item gets pressed
		 * @param {sap.ui.base.Event} oEvent the table selectionChange event
		 * @public
		 */
		onRequestFilterPressed: function (oEvent) {
			if (!this._oRequestFilterDialog) {
				this._oRequestFilterDialog = sap.ui.xmlfragment(
					"com.bmc.hcm.erf.fragment.EmployeeRequestFilterDialog",
					this
				);
				this.getView().addDependent(this._oRequestFilterDialog);
			}
			this._oRequestFilterDialog.open();
		},
		onRequestFilterConfirmed: function (oEvent) {
			var aParams = oEvent.getParameters();
			var oIconTabBar = this.byId("idIconTabBar");
			var aActiveFilter = this._getActiveFilters(oIconTabBar.getSelectedKey());
			var oViewModel = this.getModel("requestListView");

			oViewModel.setProperty("/filterText", aParams.filterString);

			this._applySearch(aActiveFilter);
			oViewModel.refresh(true);
		},
		onRequestFilterReset: function (oEvent) {
			var oViewModel = this.getModel("requestListView");
			var aStatusFilters = oViewModel.getProperty("/statusFilters");

			$.each(aStatusFilters, function (sIndex, oFilter) {
				oFilter.Selected = false;
			});
			oViewModel.setProperty("/statusFilters", aStatusFilters);
			oViewModel.setProperty("/filterText", "");

			var oIconTabBar = this.byId("idIconTabBar");
			var aActiveFilter = this._getActiveFilters(oIconTabBar.getSelectedKey());
			this._applySearch(aActiveFilter);
			oViewModel.refresh(true);

		},
		onCheckFilterActive: function (aFilters) {
			console.log(aFilters);
			var aActive = _.filter(aFilters, ["Selected", true]);

			return aActive.length > 0;
		},
		onNewEmployeeRequest: function (oEvent) {
			SharedData.setCurrentRequest(null);
			this.getRouter().navTo("employeerequestnew");
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
		_openRequestActions: function (oData, oSource) {
			if (this._adjustRequestActions(oData)) {
				if (!this._requestActions) {
					this._requestActions = sap.ui.xmlfragment(
						"com.bmc.hcm.erf.fragment.RequestActions",
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
		onCheckActionAvailable: function (sErfsf) {
			var oStatus = _.filter(this.statusFilters, ["Status", sErfsf]);
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
			var oViewModel = this.getModel("requestListView");

			switch (sAction) {
			case "Edit":
				/*Set application settings*/
				oApplicationSettings.Edit = true;
				oApplicationSettings.CallerRole = this.callerRole;
				if (this.callerRole === "RECRUITER") {
					oApplicationSettings.Edit = false;
				}
				SharedData.setApplicationSettings(oApplicationSettings);
				/*Set request data*/
				SharedData.setCurrentRequest(_.cloneDeep(oFormData));
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
				SharedData.setCurrentRequest(_.cloneDeep(oFormData));
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
			var oIconTabBar = this.byId("idIconTabBar");
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
		_getActiveFilters: function (sKey) {
			var aFilters = [];
			var oThis = this;
			var oViewModel = this.getModel("requestListView");
			if (this.callerRole === "MANAGER") {
				aFilters = [
					new Filter("Erfap", FilterOperator.EQ, "MY_REQUESTS"),
					new Filter("Erfsf", FilterOperator.EQ, sKey)
				];
			} else if (this.callerRole === "RECRUITER") {
				aFilters = [
					new Filter("Erfap", FilterOperator.EQ, "REQUESTS_APPROVED"),
					//new Filter("Erfsf", FilterOperator.EQ, "APP"),
					new Filter("Erfrf", FilterOperator.EQ, sKey)
				];
				var aStatusFilters = _.filter(oViewModel.getProperty("/statusFilters"), ["Selected", true]);

				if (aStatusFilters.length > 0) {
					$.each(aStatusFilters, function (sFilterIndex, oStatusFilter) {
						aFilters.push(new Filter("Erfsf", FilterOperator.EQ, oStatusFilter.Erfsf));
					});
				} else {
					var oDefaultFilters = _.find(oThis.statusFilters, ["Status", sKey]);
					$.each(oDefaultFilters.DefaultStatus, function (sStatusIndex, sDefaultStatus) {
						aFilters.push(new Filter("Erfsf", FilterOperator.EQ, sDefaultStatus));
					});
				}

			}
			return aFilters;
		},
		onIconFilterSelect: function (oEvent) {
			var oTable = this.byId("idEmployeeRequestTable");
			var sKey = oEvent.getParameter("key");

			var aFilters = this._getActiveFilters(sKey);

			oTable.getBinding("items").filter(aFilters, "Application");
		},

		onGetText: function (sTextCode) {
			return this.getText(sTextCode);
		},

		/**
		 * Event handler for refresh event. Keeps filter, sort
		 * and group settings and refreshes the list binding.
		 * @public
		 */
		onRefresh: function () {
			var oTable = this.byId("idEmployeeRequestTable");
			oTable.getBinding("items").refresh();
		},

		/* =========================================================== */
		/* internal methods                                            */
		/* =========================================================== */

		_onManagerRequestListMatched: function (oEvent) {
			this.statusFilters = this.allStatusFilters.MANAGER.Statuses;
			this.callerRole = "MANAGER";
			this.onRefresh();

		},
		_onRecruiterRequestListMatched: function (oEvent) {
			this.statusFilters = this.allStatusFilters.RECRUITER.Statuses;
			this.callerRole = "RECRUITER";
			this.onRefresh();
		},

		/**
		 * Edits the selected item on the object page
		 * On phones a additional history entry is created
		 * @param {sap.m.ObjectListItem} oItem selected Item
		 * @private
		 */
		_editRequest: function (oItem) {
			this.getRouter().navTo("employeerequestedit", {
				Erfid: oItem.getBindingContext().getProperty("Erfid")
			});
		},

		/**
		 * Internal helper method to apply both filter and search state together on the list binding
		 * @param {sap.ui.model.Filter[]} aTableSearchState An array of filters for the search
		 * @private
		 */
		_applySearch: function (aTableSearchState) {
			var oTable = this.byId("idEmployeeRequestTable"),
				oViewModel = this.getModel("requestListView");
			oTable.getBinding("items").filter(aTableSearchState, "Application");
			// changes the noDataText of the list in case there are no filter results
			if (aTableSearchState.length !== 0) {
				oViewModel.setProperty("/tableNoDataText", this.getText("EMPTY_REQUEST_LIST_SEARCH"));
			}
		},

		_updateFilterCounts: function (oModel) {
			var oViewModel = this.getModel("requestListView");
			var aFilters = [];
			var oThis = this;

			$.each(this.statusFilters, function (sIndex, oFilter) {

				if (oThis.callerRole === "MANAGER") {
					aFilters = [
						new Filter("Erfap", FilterOperator.EQ, "MY_REQUESTS"),
						new Filter("Erfsf", FilterOperator.EQ, oFilter.Status)
					];
				} else if (oThis.callerRole === "RECRUITER") {
					aFilters = [
						new Filter("Erfap", FilterOperator.EQ, "REQUESTS_APPROVED"),
						//new Filter("Erfsf", FilterOperator.EQ, "APP"),
						new Filter("Erfrf", FilterOperator.EQ, oFilter.Status)
					];
					var aStatusFilters = _.filter(oViewModel.getProperty("/statusFilters"), ["Selected", true]);

					if (aStatusFilters.length > 0) {
						$.each(aStatusFilters, function (sFilterIndex, oStatusFilter) {
							aFilters.push(new Filter("Erfsf", FilterOperator.EQ, oStatusFilter.Erfsf));
						});
					} else {
						var oDefaultFilters = _.find(oThis.statusFilters, ["Status", oFilter.Status]);
						$.each(oDefaultFilters.DefaultStatus, function (sStatusIndex, sDefaultStatus) {
							aFilters.push(new Filter("Erfsf", FilterOperator.EQ, sDefaultStatus));
						});
					}
				}

				oModel.read("/EmployeeRequestFormSet/$count", {
					filters: aFilters,
					success: function (oData, oResponse) {
						oViewModel.setProperty("/searchResults/" + oFilter.Status, oResponse.body);
					},
					error: function (oError) {
						oViewModel.setProperty("/searchResults/" + oFilter.Status, 0);
					}
				});
			});

		},
		_adjustRequestActions: function (oData) {
			var oViewModel = this.getModel("requestListView");
			var sStatusName = "";

			if (this.callerRole === "MANAGER") {
				sStatusName = "Erfsf";
			} else if (this.callerRole === "RECRUITER") {
				sStatusName = "Erfrf";
			}

			oViewModel.setProperty("/requestActions", []);

			var oStatus = _.filter(this.statusFilters, ["Status", oData[sStatusName]]);

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