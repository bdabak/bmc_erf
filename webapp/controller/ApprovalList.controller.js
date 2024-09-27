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

	return BaseController.extend("com.bmc.hcm.erf.controller.ApprovalList", {

		formatter: formatter,

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
				oTable = this.byId("idApprovalListTable");

			// Put down requestList table's original value for busy indicator delay,
			// so it can be restored later on. Busy handling on the table is
			// taken care of by the table itself.
			iOriginalBusyDelay = oTable.getBusyIndicatorDelay();

			// keeps the search state
			this._aTableSearchState = [];

			// Model used to manipulate control states
			oViewModel = new JSONModel({
				requestListTableTitle: this.getText("REQUESTS_WAITING_APPROVAL"),
				tableNoDataText: this.getText("EMPTY_REQUEST_LIST"),
				tableBusyDelay: 0,
				busy: false
			});
			this.setModel(oViewModel, "approvalListView");

			// Make sure, busy indication is showing immediately so there is no
			// break after the busy indication for loading the view's meta data is
			// ended (see promise 'oWhenMetadataIsLoaded' in AppController)
			oTable.attachEventOnce("updateFinished", function () {
				// Restore original busy indicator delay for requestList's table
				oViewModel.setProperty("/tableBusyDelay", iOriginalBusyDelay);
			});

			this.getRouter().getRoute("approvallist").attachPatternMatched(this._onApprovalListMatched, this);

			this.initOperations();

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
				oViewModel = this.getModel("approvalListView");

			oViewModel.setProperty("/busy", false);

			sTitle = this.getText("REQUESTS_WAITING_APPROVAL");
			oViewModel.setProperty("/requestListTableTitle", sTitle);

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
			var oViewModel = this.getModel("approvalListView");

			oViewModel.setProperty("/busy", true);
		},

		/**
		 * Event handler when a table item gets pressed
		 * @param {sap.ui.base.Event} oEvent the table selectionChange event
		 * @public
		 */
		onRequestDetail: function (oEvent) {
			// The source is the list item that got pressed
			var oSource = oEvent.getSource();
			var oData = this.getModel().getProperty(oSource.getBindingContextPath());
			var oApplicationSettings = {};
			var oViewModel = this.getModel("approvalListView");

			oApplicationSettings.Edit = false;
			oApplicationSettings.CallerRole = "APPROVER";
			SharedData.setApplicationSettings(oApplicationSettings);
			SharedData.setCurrentRequest(oData);
			oViewModel.setProperty("/busy", true);
			this.getRouter().navTo("employeerequestedit", {
				Erfid: oData.Erfid
			});
		},

		onSearch: function (oEvent) {
			var aTableSearchState = [];
			var sQuery = oEvent.getParameter("query");

			if (sQuery && sQuery.length > 0) {
				aTableSearchState = [new Filter("Erfsd", FilterOperator.Contains, sQuery)];
			}
			this._applySearch(aTableSearchState);
		},

		/**
		 * Event handler for refresh event. Keeps filter, sort
		 * and group settings and refreshes the list binding.
		 * @public
		 */
		onRefresh: function () {
			var oTable = this.byId("idApprovalListTable");
			oTable.getBinding("items").refresh();
		},

		/* =========================================================== */
		/* internal methods                                            */
		/* =========================================================== */

		_onApprovalListMatched: function (oEvent) {
			this.onRefresh();
		},

		_getDefaultFilters: function () {
			var aFilters = [
				new Filter("Erfap", FilterOperator.EQ, "REQUESTS_ON_ME"),
				new Filter("Erfsf", FilterOperator.EQ, "ALL")
			];

			return aFilters;
		},

		/**
		 * Internal helper method to apply both filter and search state together on the list binding
		 * @param {sap.ui.model.Filter[]} aTableSearchState An array of filters for the search
		 * @private
		 */
		_applySearch: function (aTableSearchState) {
			var oTable = this.byId("idApprovalListTable"),
				oViewModel = this.getModel("approvalListView");

			var aFilters = _.concat(aTableSearchState, this._getDefaultFilters());

			oTable.getBinding("items").filter(aFilters, "Application");

			// changes the noDataText of the list in case there are no filter results
			if (aTableSearchState.length !== 0) {
				oViewModel.setProperty("/tableNoDataText", this.getText("EMPTY_REQUEST_LIST_SEARCH"));
			}
		}

	});
});