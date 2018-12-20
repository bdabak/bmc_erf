/*global location history */
/*global _*/
/*global moment:true */
var type = "";

sap.ui.define([
	'sap/m/MessagePopover',
	"com/bmc/hcm/erf/controller/SharedData",
	'sap/m/MessageItem',
	"com/bmc/hcm/erf/controller/BaseController",
	"sap/ui/model/json/JSONModel",
	"sap/ui/core/routing/History",
	"com/bmc/hcm/erf/model/formatter",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/m/MessageBox",
	"sap/m/MessageToast"
], function (MessagePopover, SharedData, MessageItem, BaseController, JSONModel, History, formatter, Filter, FilterOperator, MessageBox,
	MessageToast) {
	"use strict";
	var oMessageTemplate = new MessageItem({
		type: 'Error',
		title: '{Infty}-{Subty} bilgi tipinde hata',
		description: '{Message}',
		subtitle: '{Message}'
	});

	var oMessagePopover = new MessagePopover({
		items: {
			path: '/',
			template: oMessageTemplate
		}
	});
	var mModel = new JSONModel();

	oMessagePopover.setModel(mModel);
	return BaseController.extend("com.bmc.hcm.erf.controller.CandidateDetail", {

		formatter: formatter,
		_initModel: null,
		/* =========================================================== */
		/* lifecycle methods                                           */
		/* =========================================================== */

		/**
		 * Called when the worklist controller is instantiated.
		 * @public
		 */
		onInit: function () {
			var oViewModel;
			var sBegda = new Date();
			sBegda.setHours(9);
			// Put down worklist table's original value for busy indicator delay,
			// so it can be restored later on. Busy handling on the table is
			// taken care of by the table itself

			// Model used to manipulate control states
			oViewModel = new JSONModel({
				busy: false,
				delay: 0,
				candidateData: {
					Tclas: "",
					Pernr: "00000000",
					Optyp: "",
					CandidateExamSet: [],
					CandidateForeignLanguageSet: [],
					CandidateTrainingsSet: [],
					CandidateReferenceInfoSet: [],
					CandidateHealth: {},
					CandidateIntegrationInfoSet: [],
					CandidateCommunicationSet: [],
					CandidateReturn: {},
					CandidateEducationSet: [],
					CandidateCertificateSet: [],
					CandidateWorkExperienceSet: [],
					CandidateMilitaryStatus: {},
					CandidatePersonalInfo: {},
					CandidateAdress: {},
					CandidateAdditionalInfo: {},
					CandidateResourceReference: {},
					CandidateNotesSet: []
				},
				type: {
					"operation": "Create",
					"path": ""
				},
				error: {
					number: 0
				},
				visibility: true,
				iconColor: {
					"EducationExperience": "Neutral",
					"CandidateReferenceInfoSet": "Neutral",
					"CandidateIntegrationInfoSet": "Neutral"
				},
				helpText: {
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
					"Bolum": "Bolum",
					"Attty": "Attty",
					"Canat": "Canat",
					"Erfat": "Erfat",
					"Intty": "Intty",
					"Gblnd": "Gblnd",
					"Natio": "Natio",
					"State": "State",
					"Land1": "Land1"
				},
				CurrentUser: {},
				CandidateHealthLine: {
					"Tclaskey": "B",
					"Pernrkey": "",
					"Inftykey": "9007",
					"Subtykey": "",
					"Begdakey": null,
					"Enddakey": null,
					"Seqnrkey": "",
					"Sprpskey": "",
					"Objpskey": ""
				},
				CandidateEducationLine: {
					"Tclaskey": "B",
					"Pernrkey": "",
					"Inftykey": "9004",
					"Subtykey": "",
					"Begdakey": null,
					"Enddakey": null,
					"Seqnrkey": "",
					"Sprpskey": "",
					"Objpskey": ""
				},
				CandidateCommunicationLine: {
					"Tclaskey": "B",
					"Pernrkey": "",
					"Inftykey": "0105",
					"Subtykey": "",
					"Begdakey": null,
					"Enddakey": null,
					"Seqnrkey": "",
					"Sprpskey": "",
					"Objpskey": ""
				},
				CandidateExamLine: {
					"Tclaskey": "B",
					"Pernrkey": "",
					"Inftykey": "9009",
					"Subtykey": "",
					"Begdakey": null,
					"Enddakey": null,
					"Seqnrkey": "",
					"Sprpskey": "",
					"Objpskey": ""
				},
				CandidateIntegrationInfoLine: {
					"Tclaskey": "B",
					"Pernrkey": "",
					"Inftykey": "9013",
					"Subtykey": "",
					"Begdakey": null,
					"Enddakey": null,
					"Seqnrkey": "",
					"Sprpskey": "",
					"Objpskey": ""
				},
				CandidateReferenceInfoLine: {
					"Tclaskey": "B",
					"Pernrkey": "",
					"Inftykey": "9011",
					"Subtykey": "",
					"Begdakey": null,
					"Enddakey": null,
					"Seqnrkey": "",
					"Sprpskey": "",
					"Objpskey": ""
				},
				CandidateWorkExperienceLine: {
					"Tclaskey": "B",
					"Pernrkey": "",
					"Inftykey": "0023",
					"Subtykey": "",
					"Begdakey": null,
					"Enddakey": null,
					"Seqnrkey": "",
					"Sprpskey": "",
					"Objpskey": ""
				},
				CandidateCertificateLine: {
					"Tclaskey": "B",
					"Pernrkey": "",
					"Inftykey": "9003",
					"Subtykey": "",
					"Begdakey": null,
					"Enddakey": null,
					"Seqnrkey": "",
					"Sprpskey": "",
					"Objpskey": ""
				},
				CandidateTrainingsLine: {
					"Tclaskey": "B",
					"Pernrkey": "",
					"Inftykey": "9010",
					"Subtykey": "",
					"Begdakey": null,
					"Enddakey": null,
					"Seqnrkey": "",
					"Sprpskey": "",
					"Objpskey": ""
				},
				CandidateForeignLanguageLine: {
					"Tclaskey": "B",
					"Pernrkey": "",
					"Inftykey": "9008",
					"Subtykey": "",
					"Begdakey": null,
					"Enddakey": null,
					"Seqnrkey": "",
					"Sprpskey": "",
					"Objpskey": ""
				},
				CandidateNotesLine: {
					"Tclaskey": "B",
					"Pernrkey": "",
					"Inftykey": "9015",
					"Subtykey": "",
					"Begdakey": null,
					"Enddakey": null,
					"Seqnrkey": "",
					"Sprpskey": "",
					"Objpskey": ""
				}
			});
			this.setModel(oViewModel, "candidateModel");
			this._initModel = this.getModel("candidateModel").getProperty("/candidateData");
			this.initOperations();
			this.getRouter().getRoute("candidateedit").attachPatternMatched(this._onCandidateEditMatched, this);
			this.getRouter().getRoute("candidatecreate").attachPatternMatched(this._onCandidateCreateMatched, this);
			var oModel = this.getOwnerComponent().getModel();
			var that = this;
			oModel.metadataLoaded().then(function () {
				that._initialValueHelp(oModel);
			});

		},
		onCandidateImagePressed: function (oEvent) {
			var oSource = oEvent.getSource();

			// create dialog lazily
			if (!this._oCandidatePhotoUploadDialog) {
				// create dialog via fragment factory
				this._oCandidatePhotoUploadDialog = sap.ui.xmlfragment("com.bmc.hcm.erf.fragment.CandidateUploadPhoto", this);
				// connect dialog to view (models, lifecycle)
				this.getView().addDependent(this._oCandidatePhotoUploadDialog);
			}

			var oFileUploader = sap.ui.getCore().byId("idCandidatePhotoUploader");
			try {
				if (oFileUploader) {
					oFileUploader.clear();
				}
			} catch (oErr) {
				jQuery.sap.log.error("File uploader not loaded yet...");
			}
			this._oCandidatePhotoUploadDialog.data("imageSource", oSource.getSrc());
			this._oCandidatePhotoUploadDialog.data("sourceElement", oSource);
			this._oCandidatePhotoUploadDialog.open();

		},
		onMessagePress: function (oEvent) {
			oMessagePopover.toggle(oEvent.getSource());
		},
		// Attachment Kısmı Başlangıç
		onDeleteAttachment: function (oEvent) {
			var oModel = this.getModel();
			var oThis = this;
			var oViewModel = this.getModel("candidateModel");
			var Attid = oEvent.getSource().getBindingContext().getProperty("Attid");
			var sPath = "/CandidateAttachmentSet(Attid=guid'" + Attid + "')";
			var _doDeleteAttachment = function () {
				var oMessageModel = oMessagePopover.getModel();
				var oMessageData = {};
				oMessageModel.setData(oMessageData);
				oViewModel.setProperty("/busy", true);

				oModel.remove(sPath, {
					success: function (oData, oResponse) {
						if (oResponse["headers"]["message"]) {
							oThis._callMessageToast("Aday evrağı silinirken hata", "E");
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
			this._openUploadAttachmentDialog(oEvent.getParameter("item").getProperty("key"));
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
		onCandidatePhotoUploadPress: function (oEvent) {
			var oFileUploader = sap.ui.getCore().byId("idCandidatePhotoUploader");
			var oImage = this._oCandidatePhotoUploadDialog.data("sourceElement");

			if (!oFileUploader.getValue()) {
				this._callMessageToast(this.getText("FILE_SELECTION_REQUIRED"), "W");
				return;
			}

			var oModel = this.getModel();
			var oViewModel = this.getModel("candidateModel");
			var sPernr = oViewModel.getProperty("/candidateData/Pernr");
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
			var sPath = oModel.sServiceUrl + "/CandidateOperationSet(Tclas='B',Pernr='" + sPernr + "')/Candidate";

			oFileUploader.setUploadUrl(sPath);

			/*Upload file*/
			oImage.setSrc(jQuery.sap.getModulePath("com.bmc.hcm.erf", "/images/loading.gif"));
			this._openBusyFragment("PHOTO_BEING_UPLOADED");
			oFileUploader.upload();
		},

		onCandidatePhotoUploadComplete: function (oEvent) {

			var oFileUploader = sap.ui.getCore().byId("idCandidatePhotoUploader");
			var oImage = this._oCandidatePhotoUploadDialog.data("sourceElement");
			oFileUploader.destroyHeaderParameters();
			oFileUploader.clear();

			var sStatus = oEvent.getParameter("status");
			var sResponse = oEvent.getParameter("response");
			this._closeBusyFragment();

			if (sStatus == "201" || sStatus == "200") {
				this._oCandidatePhotoUploadDialog.close();
				this._callMessageToast(this.getText("PHOTO_UPLOAD_SUCCESS"), "S");
			} else {
				MessageBox.error(this.getText("PHOTO_UPLOAD_ERROR", [sResponse]));
			}
			oImage.setSrc(this._oCandidatePhotoUploadDialog.data("imageSource"));
			this.getModel().refresh(true);
		},

		onAttachmentUploadPress: function (oEvent) {
			var oFileUploader = sap.ui.getCore().byId("idAttachmentFileUploader");

			if (!oFileUploader.getValue()) {
				this._callMessageToast(this.getText("FILE_SELECTION_REQUIRED"), "W");
				return;
			}

			var oModel = this.getModel();
			var oViewModel = this.getModel("candidateModel");
			var sPernr = oViewModel.getProperty("/candidateData/Pernr");
			var sAttty = this._oUploadAttachmentDialog.data("AttachmentType");
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
			var sPath = oModel.sServiceUrl + "/CandidateAttachmentOperationSet(Tclas='B',Pernr='" + sPernr + "',Attty='" + sAttty +
				"')/CandidateAttachmentSet";

			oFileUploader.setUploadUrl(sPath);

			/*Upload file*/
			this._openBusyFragment("ATTACHMENT_BEING_UPLOADED");
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
			MessageToast.show(this.getText("FILE_UPLOAD_WARNING", [oEvent.getParameter("newValue")]));
		},

		onFileSizeExceed: function (oEvent) {
			MessageToast.show(this.getText("FILE_SIZE_EXCEEDED", [oEvent.getSource().getMaximumFileSize()]));
		},
		onCloseUploadFormDialog: function () {
			MessageToast.show(this.getText("FILE_UPLOAD_CANCELLED"));
			this._oUploadAttachmentDialog.close();
		},
		onCloseCandidatePhotoUploadDialog: function () {
			MessageToast.show(this.getText("PHOTO_UPLOAD_CANCELLED"));
			this._oCandidatePhotoUploadDialog.close();
		},

		_openUploadAttachmentDialog: function (sAttty) {

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
			this._oUploadAttachmentDialog.open();
		},
		// Attachment Bitiş	
		/* =========================================================== */
		/* Navigate back                                               */
		/* =========================================================== */
		onNavBack: function (oEvent) {
			this.goBack(History);
		},
		onDelete: function (oEvent) {
			var that = this;
			var oViewModel = this.getModel("candidateModel");
			var entityset = oEvent.getSource().data("mdl");
			var oModel = this.getModel();
			var Path = oEvent.getSource().getParent().getParent().getBindingContext("candidateModel").getPath();
			var oRowData = this.getModel("candidateModel").getProperty(Path);

			if (this._createMode) {
				oViewModel.setProperty(Path, null);
				var c = Path.split("/");
				c = c[c.length - 1];
				oEvent.getSource().getModel("candidateModel").getData().candidateData[entityset].splice(c, 1);
				oViewModel.refresh(true);
			} else {
				/*Edit mode*/
				var _deleteRow = function () {
					var oMessageModel = oMessagePopover.getModel();
					var oMessageData = {};
					oMessageModel.setData(oMessageData);
					oViewModel.setProperty("/busy", true);
					var sPath = oModel.createKey("/" + entityset, {
						Pernrkey: oRowData.Pernrkey,
						Tclaskey: oRowData.Tclaskey,
						Inftykey: oRowData.Inftykey,
						Subtykey: oRowData.Subtykey,
						Begdakey: oRowData.Begdakey,
						Enddakey: oRowData.Enddakey,
						Seqnrkey: oRowData.Seqnrkey,
						Sprpskey: oRowData.Sprpskey,
						Objpskey: oRowData.Objpskey
					});
					oModel.remove(sPath, {
						success: function (oData, oResponse) {
							if (oResponse["headers"]["message"]) {
								oMessageData[0] = {
									Infty: oRowData.Inftykey,
									Subty: oRowData.Subtykey,
									Message: oResponse["headers"]["message"]
								};
								that._callMessageToast("Aday bilgisini silerken hata", "E");

								oMessageModel.setData(oMessageData);
								that.getModel("candidateModel").setProperty("/error/number", 1);
							} else {
								that.getModel("candidateModel").setProperty("/error/number", 0);
								that._callMessageToast("Bilgi başarıyla silindi", "S");
							}
							that._refreshAfterOperation(entityset, oRowData.Pernrkey);
						},
						error: function (oError) {

						}
					});

				};
				var oBeginButtonProp = {
					text: this.getText("DELETE"),
					type: "Reject",
					icon: "sap-icon://delete",
					onPressed: _deleteRow

				};

				this._callConfirmDialog(this.getText("CONFIRMATION_REQUIRED"), "Message", "Warning", this.getText("CONFIRM_DELETION"),
					oBeginButtonProp, null).open();
			}

		},
		_refreshAfterOperation: function (Entityset, Pernr) {
			var oViewModel = this.getModel("candidateModel");
			var aFilters = [new Filter("Pernrkey", FilterOperator.EQ, Pernr)];
			this.getModel().read("/" + Entityset, {
				filters: aFilters,
				success: function (oData, oResponse) {
					oViewModel.setProperty("/candidateData/" + Entityset, oData.results);
					oViewModel.setProperty("/busy", false);
				},
				error: function (oError) {

				}
			});

		},
		onEdit: function (oEvent) {
			var oViewModel = this.getModel("candidateModel");
			var Path = oEvent.getSource().getParent().getParent().getBindingContext("candidateModel").getPath();
			oViewModel.setProperty("/type/path", Path);
			var oRowData = oViewModel.getProperty(Path);
			oViewModel.setProperty("/type/operation", "Update");

			var entity = oEvent.getSource().data("mdl");
			var fragment = entity.substring(0, entity.length - 3);
			var line = fragment + "Line";
			oViewModel.setProperty("/" + line, oRowData);
			this._Dialog(fragment).open();
		},
		onNewDialogFragment: function (oEvent) {
			var oViewModel = this.getModel("candidateModel");
			oViewModel.setProperty("/type/path", "");
			oViewModel.setProperty("/type/operation", "Create");
			var ftype = oEvent.getSource().data("ftype");
			var oCurrentUser = SharedData.getCurrentUser();

			if (ftype === "CandidateNotes") {
				oViewModel.setProperty("/CandidateNotesLine/Cmnow", oCurrentUser.Pernr);
				oViewModel.setProperty("/CandidateNotesLine/Cmnon", oCurrentUser.Ename);
			}

			this._Dialog(ftype).open();
		},
		_Dialog: function (ftype) {
			this._oDialog = sap.ui.xmlfragment("com.bmc.hcm.erf.fragment.NewEdit" + ftype, this);
			this.getView().addDependent(this._oDialog);
			jQuery.sap.syncStyleClass("sapUiSizeCompact", this.getView(), this._oDialog);
			return this._oDialog;
		},

		onDialogSave: function (oEvent) {
			if (this._createMode) {
				this.onDialogSaveCreate(oEvent);
			} else {
				this.onDialogSaveEdit(oEvent);
			}
		},
		onDialogSaveCreate: function (oEvent) {
			var operation = this._oDialog.data("operation");
			var Path = this._oDialog.data("Path");
			var line = oEvent.getSource().data("model") + "Line";
			var entity = oEvent.getSource().data("model") + "Set";
			var oCopyForm = Object.assign({}, oEvent.getSource().getModel("candidateModel")
				.getProperty("/" + line));
			Object.keys(oCopyForm).map(function (item) {
				if (oCopyForm[item] instanceof moment) {
					oCopyForm[item] = oCopyForm[item].add(9, "h");
				}
			});
			if (operation === "Create") {

				if (oCopyForm.hasOwnProperty("Begdakey") && oCopyForm.Begdakey === null) {
					oCopyForm.Begdakey = new Date();
					oCopyForm.Begdakey.setHours(9);
				}

				if (oCopyForm.hasOwnProperty("Enddakey") && oCopyForm.Enddakey === null) {
					oCopyForm.Enddakey = new Date("9999/12/31 09:00:00");
				}

				oEvent.getSource().getModel("candidateModel").getData().candidateData[entity].push(oCopyForm);
			} else {
				oEvent.getSource().getModel("candidateModel").setProperty(Path, oEvent.getSource().getModel("candidateModel")
					.getProperty("/" + line));
			}
			this._oDialog.close();
			var begda = new Date();

			var emptyData = Object.assign({}, oCopyForm);
			Object.keys(emptyData).map(function (item) {
				if (emptyData[item] instanceof Date) {
					emptyData[item] = begda;
				} else if (item === "Tclaskey") {
					emptyData[item] = "B";
				} else {
					emptyData[item] = '';
				}
			});
			oEvent.getSource().getModel("candidateModel").getData()[line] = emptyData;

			this.getModel("candidateModel").refresh(true);
		},

		onDialogSaveEdit: function (oEvent) {
			var that = this;
			var operation = this._oDialog.data("operation");
			var Path = this._oDialog.data("path");
			var oViewModel = this.getModel("candidateModel");
			var oModel = this.getModel();
			var Pernr = oViewModel.getProperty("/candidateData/Pernr");
			var line = oEvent.getSource().data("model") + "Line";
			var entity = oEvent.getSource().data("model") + "Set";
			var oMessageModel = oMessagePopover.getModel();
			var oMessageData = {};
			oMessageModel.setData(oMessageData);
			oEvent.getSource().getModel("candidateModel").setProperty("/" + line + "/Pernrkey", Pernr);
			var oCopyForm = Object.assign({}, oEvent.getSource().getModel("candidateModel")
				.getProperty("/" + line));
			if (oCopyForm.hasOwnProperty("__metadata")) {
				delete oCopyForm["__metadata"];
			}

			if (oCopyForm.hasOwnProperty("Begdakey")) {
				if (oCopyForm.Begdakey === null) {
					oCopyForm.Begdakey = oCopyForm.Begda ? oCopyForm.Begda : new Date();
				}
			}

			if (oCopyForm.hasOwnProperty("Enddakey")) {
				if (oCopyForm.Enddakey === null) {
					oCopyForm.Enddakey = oCopyForm.Endda ? oCopyForm.Endda : new Date();
				}
			}

			if (operation === "Create") {
				oViewModel.setProperty("/busy", true);
				oModel.create("/" + entity, oCopyForm, {
					success: function (oData, oResponse) {
						oViewModel.setProperty("/busy", false);
						if (oResponse["headers"]["message"]) {
							oMessageData[0] = {
								Infty: oCopyForm.Inftykey,
								Subty: oCopyForm.Subtykey,
								Message: oResponse["headers"]["message"]
							};
							that._callMessageToast("Aday bilgisini kayıt ederken hata", "E");

							oMessageModel.setData(oMessageData);
							oViewModel.setProperty("/error/number", 1);
						} else {
							oViewModel.setProperty("/error/number", 0);
							that._callMessageToast("Bilgi başarıyla oluşturuldu", "S");
						}
						that._refreshAfterOperation(entity, Pernr);
					},
					error: function (oError) {
						oViewModel.setProperty("/busy", false);
					}
				});

			} else {
				var oRowData = oViewModel.getProperty(Path);
				var sPath = oModel.createKey("/" + entity, {
					Pernrkey: oRowData.Pernrkey,
					Tclaskey: oRowData.Tclaskey,
					Inftykey: oRowData.Inftykey,
					Subtykey: oRowData.Subtykey,
					Begdakey: oRowData.Begdakey,
					Enddakey: oRowData.Enddakey,
					Seqnrkey: oRowData.Seqnrkey,
					Sprpskey: oRowData.Sprpskey,
					Objpskey: oRowData.Objpskey

				});
				oViewModel.setProperty("/busy", true);
				oModel.update(sPath, oCopyForm, {
					success: function (oData, oResponse) {
						oViewModel.setProperty("/busy", false);
						if (oResponse["headers"]["message"]) {
							oMessageData[0] = {
								Infty: oCopyForm.Inftykey,
								Subty: oCopyForm.Subtykey,
								Message: oResponse["headers"]["message"]
							};
							that._callMessageToast("Aday bilgisini güncellerken hata", "E");

							oMessageModel.setData(oMessageData);
							oViewModel.setProperty("/error/number", 1);
						} else {
							oViewModel.setProperty("/error/number", 0);
							that._callMessageToast("Bilgi başarıyla güncellendi", "S");
						}
						that._refreshAfterOperation(entity, Pernr);
					},
					error: function (oError) {
						oViewModel.setProperty("/busy", false);
					}
				});
			}
			this._oDialog.close();

			var emptyData = Object.assign({}, oCopyForm);
			Object.keys(emptyData).map(function (item) {
				if (item === "Begdakey" || item === "Enddakey") {
					emptyData[item] = null;
				} else if (item === "Tclaskey") {
					emptyData[item] = "B";
				} else if (item === "Inftykey") {
					emptyData[item] = oCopyForm["Inftykey"];
				} else {
					emptyData[item] = "";
				}
			});
			oEvent.getSource().getModel("candidateModel").getData()[line] = emptyData;

			this.getModel("candidateModel").refresh(true);

		},
		onDialogCancel: function (oEvent) {
			var line = oEvent.getSource().data("model") + "Line";

			var oCopyForm = Object.assign({}, oEvent.getSource().getModel("candidateModel")
				.getProperty("/" + line));
			if (!this._createMode) {
				var Pernr = this.getModel("candidateModel").getProperty("/candidateData/Pernr");
				var entity = oEvent.getSource().data("model") + "Set";
				this._refreshAfterOperation(entity, Pernr);
			}

			var emptyData = Object.assign({}, oCopyForm);
			Object.keys(emptyData).map(function (item) {
				if (item === "Begdakey" || item === "Enddakey") {
					emptyData[item] = null;
				} else if (item === "Tclaskey") {
					emptyData[item] = "B";
				} else if (item === "Inftykey") {
					emptyData[item] = oCopyForm["Inftykey"];
				} else {
					emptyData[item] = "";
				}
			});
			oEvent.getSource().getModel("candidateModel").getData()[line] = emptyData;
			this._oDialog.close();
		},
		onFilterSelect: function (oEvent) {

			if (oEvent.getSource().getSelectedKey() === "init") {
				this.byId("initSubIconTab").setSelectedKey("CandidatePersonalInfo");
				this.getModel("candidateModel").setProperty("/visibility", true);
			} else {
				this.getModel("candidateModel").setProperty("/visibility", false);
			}
		},
		onSubFilterSelect: function (oEvent) {

			if (oEvent.getSource().getSelectedKey() === "communication") {
				this.getModel("candidateModel").setProperty("/visibility", false);
			} else {
				this.getModel("candidateModel").setProperty("/visibility", true);
			}
		},

		_initialValueHelp: function (oModel) {
			var oViewModel = this.getModel("candidateModel");
			var aHelpText = oViewModel.getProperty("/helpText");
			var aFilters = [];

			Object.keys(aHelpText).map(function (item) {
				aFilters.push(
					new Filter("Help", FilterOperator.EQ, aHelpText[item])
				);
			});
			oModel.read("/CandidateValueHelpSet", {
				filters: aFilters,
				success: function (oData, oResponse) {
					oViewModel.refresh(true);
				},
				error: function (oError) {

				}
			});
		},
		_getValueHelpText: function (sHelp, sValue) {
			try {
				//var oVModel = this.getModel("candidateModel");
				var oModel = this.getModel();
				var sPath = "/CandidateValueHelpSet(Help='" + sHelp + "',Key='" + sValue + "')";
				var oPData = oModel.getProperty(sPath);
				return oPData.Text;

			} catch (oErr) {
				return null;
			}
		},
		onChangeUsrty: function (oEvent) {
			var oViewModel = this.getModel("candidateModel");

			oViewModel.setProperty("/CandidateCommunicationLine/Usrid", "");
			oViewModel.setProperty("/CandidateCommunicationLine/Usrid_Long", "");
		},
		onChangeHealthArea: function (oEvent) {
			var sArea = oEvent.getSource().data("area");
			var oViewModel = this.getModel("candidateModel");
			if (sArea === "Hnccn") {
				oViewModel.setProperty("/candidateData/CandidateHealth/Hndct", "");
				oViewModel.setProperty("/candidateData/CandidateHealth/Hndpr", "");
				oViewModel.setProperty("/candidateData/CandidateHealth/Hndex", "");
			} else {
				oViewModel.setProperty("/candidateData/CandidateHealth/" + sArea, "");
			}
		},
		onChangeWdart: function (oEvent) {
			var sSelected = oEvent.getSource().getSelectedKey();
			var oViewModel = this.getModel("candidateModel");
			if (sSelected === "01") {
				oViewModel.setProperty("/candidateData/CandidateMilitaryStatus/Zmrsn", "");
			} else if (sSelected === "02") {
				oViewModel.setProperty("/candidateData/CandidateMilitaryStatus/Wdgrd", "");
				oViewModel.setProperty("/candidateData/CandidateMilitaryStatus/Wdein", "");
				oViewModel.setProperty("/candidateData/CandidateMilitaryStatus/Zmrsn", "");
			} else if (sSelected === "03") {
				oViewModel.setProperty("/candidateData/CandidateMilitaryStatus/Wdgrd", "");
				oViewModel.setProperty("/candidateData/CandidateMilitaryStatus/Wdein", "");
			} else {
				oViewModel.setProperty("/candidateData/CandidateMilitaryStatus/Wdgrd", "");
				oViewModel.setProperty("/candidateData/CandidateMilitaryStatus/Wdein", "");
				oViewModel.setProperty("/candidateData/CandidateMilitaryStatus/Zmrsn", "");
			}

		},
		onChangeGesch: function (oEvent) {
			var oViewModel = this.getModel("candidateModel");
			var sGesch = oEvent.getSource().getSelectedKey();
			if (sGesch === "2") {
				this.byId("CandidateEducation").setNextStep(this.byId("CandidateAdditionalInfo"));
			} else {
				this.byId("CandidateEducation").setNextStep(this.byId("CandidateMilitaryStatus"));
			}
			oViewModel.setProperty("/candidateData/CandidateMilitaryStatus/Wdgrd", "");
			oViewModel.setProperty("/candidateData/CandidateMilitaryStatus/Wdart", "");
			oViewModel.setProperty("/candidateData/CandidateMilitaryStatus/Wdein", "");
			oViewModel.setProperty("/candidateData/CandidateMilitaryStatus/Zmrsn", "");
		},
		onCheckDrv: function (oEvent) {

			var check = oEvent.getSource().getSelectedKey();
			if (check === "0") {
				this.byId("drv1lcncdfe_id").setVisible(false);
				this.byId("drv2lcncdfe_id").setVisible(false);
				this.byId("drv1lcncefe_id").setVisible(false);
				this.byId("drv2lcncefe_id").setVisible(false);
			} else {
				this.byId("drv1lcncdfe_id").setVisible(true);
				this.byId("drv2lcncdfe_id").setVisible(true);
				this.byId("drv1lcncefe_id").setVisible(true);
				this.byId("drv2lcncefe_id").setVisible(true);
			}
		},

		onCreateCandidateCompleted: function (oEvent) {

		},

		onPressCreate: function (oEvent) {
			var that = this;
			var oMessageModel = oMessagePopover.getModel();
			var oModel = this.getModel();
			var oViewModel = this.getModel("candidateModel");
			var oMessageData = {};
			var oFormData = oViewModel.getProperty("/candidateData");
			var aCheckFields = ["CandidateHealth",
				"CandidateMilitaryStatus",
				"CandidatePersonalInfo",
				"CandidateAdditionalInfo",
				"CandidateAdress",
				"CandidateResourceReference"
			];

			$.each(aCheckFields, function (sKey, oField) {
				if (oFormData.hasOwnProperty(oField)) {
					if (!oFormData[oField].hasOwnProperty("Begdakey")) {
						oFormData[oField].Begdakey = new Date();
						oFormData[oField].Begdakey.setHours(9);
					}
					if (!oFormData[oField].hasOwnProperty("Enddakey")) {
						oFormData[oField].Enddakey = new Date("9999/12/31 09:00:00");
					}

				}
			});

			oMessageModel.setData(oMessageData);
			oViewModel.setProperty("/busy", true);
			oModel.create("/CandidateOperationSet", oFormData, {
				success: function (oData, oResponse) {
					oViewModel.setProperty("/busy", false);
					if (oData.CandidateReturn.Msgty === "E") {
						oMessageData[0] = {
							Infty: oData.CandidateReturn.Infty,
							Subty: oData.CandidateReturn.Subty,
							Message: oData.CandidateReturn.Message
						};
						that._callMessageToast("Aday oluştururken hata", "E");

						oMessageModel.setData(oMessageData);
						that.getModel("candidateModel").setProperty("/error/number", 1);

					} else {
						that._callMessageToast("Aday başarıyla oluşturuldu", "S");
						that.getRouter().navTo("candidatelist");
					}
				},
				error: function (oError) {
					oViewModel.setProperty("/busy", false);
				}
			});
		},

		/**
		 * Event handler when a table item gets pressed
		 * @param {sap.ui.base.Event} oEvent the table selectionChange event
		 * @public
		 */
		onSave: function (oEvent) {
			var that = this;
			var oModel = this.getModel();
			var oMessageModel = oMessagePopover.getModel();
			var oMessageData = {};
			oMessageModel.setData(oMessageData);
			var selectedKey = this.byId("initSubIconTab").getSelectedKey();
			var oViewModel = this.getModel("candidateModel");
			var oFormData = oViewModel.getProperty("/candidateData/" + selectedKey);
			var sPath = oModel.createKey("/" + selectedKey + "Set", {
				Pernrkey: oFormData.Pernrkey,
				Tclaskey: oFormData.Tclaskey,
				Inftykey: oFormData.Inftykey,
				Subtykey: oFormData.Subtykey,
				Begdakey: oFormData.Begdakey,
				Enddakey: oFormData.Enddakey,
				Seqnrkey: oFormData.Seqnrkey,
				Sprpskey: oFormData.Sprpskey,
				Objpskey: oFormData.Objpskey

			});
			oViewModel.setProperty("/busy", true);
			oModel.update(sPath, oFormData, {
				success: function (oData, oResponse) {
					oViewModel.setProperty("/busy", false);
					if (oResponse["headers"]["message"]) {
						oMessageData[0] = {
							Infty: oFormData.Inftykey,
							Subty: oFormData.Subtykey,
							Message: oResponse["headers"]["message"]
						};
						that._callMessageToast("Aday bilgisini kayıt ederken hata oluştu", "E");
						that._refreshEntity(sPath, selectedKey);
						oMessageModel.setData(oMessageData);
						//oMessageModel.setData(oData.CandidateReturn);
						that.getModel("candidateModel").setProperty("/error/number", 1);
					} else {
						that._refreshEntity(sPath, selectedKey);
						that.getModel("candidateModel").setProperty("/error/number", 0);
						that._callMessageToast("Bilgi başarıyla güncellendi", "S");
					}

				},
				error: function (oError) {
					oViewModel.setProperty("/busy", false);
				}
			});

			// The source is the list item that got pressed

		},
		_refreshEntity: function (sPath, entity) {
			var oModel = this.getModel();
			var oViewModel = this.getModel("candidateModel");
			oModel.read(sPath, {
				success: function (oData, oResponse) {

					oViewModel.setProperty("/" + entity, oData);
				},
				error: function (oError) {

				}
			});
		},

		/**
		 * Event handler when the share in JAM button has been clicked
		 * @public
		 */
		onCountryHelp: function (evt) {
			type = evt.getSource().data("type");
			var aFilter = [];
			aFilter.push(new Filter("Help", FilterOperator.EQ, type));
			this._getCountryHelpDialog().open();
			this._applyCountryFilter(aFilter);
		},

		_getCountryHelpDialog: function () {
			if (!this._oCountryHelpDialog) {
				this._oCountryHelpDialog = sap.ui.xmlfragment("com.bmc.hcm.erf.fragment.Country", this);
				this._oCountryHelpDialog.setRememberSelections(false);
				this.getView().addDependent(this._oCountryHelpDialog);
				jQuery.sap.syncStyleClass("sapUiSizeCompact", this.getView(), this._CountryHelpDialog);
			}

			return this._oCountryHelpDialog;

		},
		onCountryHelpSearch: function (oEvent) {
			this._searchCountryHelp(oEvent.getParameter("value"));
		},

		_searchCountryHelp: function (sSearchStr) {
			//	var sId = this._oF4ValueHelpInput.sId;
			var upper = sSearchStr.charAt(0).toUpperCase() + sSearchStr.slice(1);
			var aFilter = [];

			aFilter.push(new Filter("Text", FilterOperator.Contains, upper));
			aFilter.push(new Filter("Help", FilterOperator.EQ, type));

			this._applyCountryFilter(aFilter);
		},

		onCountryHelpSelected: function (oEvent) {
			var aFilter = [];

			var aContexts = oEvent.getParameter("selectedContexts");
			if (aContexts.length) {
				var oContent = aContexts[0].getModel().getData(aContexts[0].getPath());
				if (type === "Land1") {
					this.getModel("candidateModel").setProperty("/candidateData/CandidateAdress/Land1", oContent.Key);
					this.getModel("candidateModel").setProperty("/candidateData/CandidateAdress/Landx", oContent.Text);
					aFilter.push(new Filter("Text", FilterOperator.EQ, oContent.Key));
					aFilter.push(new Filter("Help", FilterOperator.EQ, "State"));
					this.byId("State_id").getBinding("items").filter(aFilter, "Application");
				} else if (type === "Gblnd") {
					this.getModel("candidateModel").setProperty("/candidateData/CandidatePersonalInfo/Gblnd", oContent.Key);
					this.getModel("candidateModel").setProperty("/candidateData/CandidatePersonalInfo/GblndTx", oContent.Text);
					aFilter.push(new Filter("Text", FilterOperator.EQ, oContent.Key));
					aFilter.push(new Filter("Help", FilterOperator.EQ, "Gbdep"));
					this.byId("Gbdep_id").getBinding("items").filter(aFilter, "Application");
				} else {
					this.getModel("candidateModel").setProperty("/candidateData/CandidatePersonalInfo/Natio", oContent.Key);
					this.getModel("candidateModel").setProperty("/candidateData/CandidatePersonalInfo/NatioTx", oContent.Text);
				}

				this.getModel("candidateModel").refresh(true);
			}
		},
		onResetEmployee: function (oEvent) {
			var oViewModel = this.getModel("candidateModel");
			var sSourceField = oEvent.getSource().data("sourceField");
			var sTextField = "";
			var sPath = "";

			switch (sSourceField) {
			case "Refpn":
				sTextField = "Refnm";
				sPath = "/candidateData/CandidateResourceReference/";
				break;
			case "Cmnow":
				sTextField = "Cmnon";
				sPath = "/CandidateNotesLine/";
				break;
			default:
				jQuery.sap.log.error("Source field not supplied!");
				return;
			}

			oViewModel.setProperty(sPath + sSourceField, "00000000");
			oViewModel.setProperty(sPath + sTextField, "");
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
			var oViewModel = this.getModel("candidateModel");
			var sSourceField = this._employeeValueHelpDialog.data("sourceField");
			var sTextField = "";
			var sPath = "";

			if (oSelectedObject) {
				switch (sSourceField) {
				case "Refpn":
					sTextField = "Refnm";
					sPath = "/candidateData/CandidateResourceReference/";
					break;
				case "Cmnow":
					sTextField = "Cmnon";
					sPath = "/CandidateNotesLine/";
					break;
				default:
					jQuery.sap.log.error("Source field not supplied!");
					return;
				}
				oViewModel.setProperty(sPath + sSourceField, oSelectedObject.Pernr);
				oViewModel.setProperty(sPath + sTextField, oSelectedObject.Ename);
			}
			oEvent.getSource().getBinding("items").filter([]);
			oEvent.getSource().getBinding("items").refresh();
			this._employeeValueHelpDialog.setRememberSelections(false);
			this._employeeValueHelpDialog.data("sourceField", null);
		},
		/**
		 * Event handler for refresh event. Keeps filter, sort
		 * and group settings and refreshes the list binding.
		 * @public
		 */
		onRefresh: function () {
			var oTable = this.byId("table");
			oTable.getBinding("items").refresh();
		},

		/* =========================================================== */
		/* internal methods                                            */
		/* =========================================================== */

		/**
		 * Shows the selected item on the object page
		 * On phones a additional history entry is created
		 * @param {sap.m.ObjectListItem} oItem selected Item
		 * @private
		 */
		_showObject: function (oItem) {
			this.getRouter().navTo("object", {
				objectId: oItem.getBindingContext().getProperty("Pernr")
			});
		},
		_applyCountryFilter: function (aTableSearchState) {
			var oTable = sap.ui.getCore().byId("help");
			//	oViewModel = this.getModel("worklistView");
			oTable.getBinding("items").filter(aTableSearchState, "Application");
			// changes the noDataText of the list in case there are no filter results

			//  oTable.getModel().refresh(true);

		},

		_getCommunicationType: function (sUsrty) {
			var oViewModel = this.getModel("candidateModel");
			var aComty = oViewModel.getProperty("/CommunicationTypeSettings");

			var oComty = _.find(aComty, ["Usrty", sUsrty]);

			return oComty;
		},
		_getIsCommunicationTypeShort: function (sUsrty) {
			var oComty = this._getCommunicationType(sUsrty);
			if (oComty) {
				if (oComty.hasOwnProperty("Islng")) {
					return !oComty.Islng;
				} else {
					return false;
				}
			} else {
				return false;
			}
		},
		_getIsCommunicationTypeLong: function (sUsrty) {
			var oComty = this._getCommunicationType(sUsrty);
			if (oComty) {
				if (oComty.hasOwnProperty("Islng")) {
					return oComty.Islng;
				} else {
					return false;
				}
			} else {
				return false;
			}
		},
		_initiateModel: function () {
			var oViewModel = this.getModel("candidateModel");
			var oCreate = {
				Tclas: "B",
				Pernr: "00000000",
				Optyp: "",
				CandidateExamSet: [],
				CandidateForeignLanguageSet: [],
				CandidateTrainingsSet: [],
				CandidateReferenceInfoSet: [],
				CandidateHealth: {},
				CandidateIntegrationInfoSet: [],
				CandidateCommunicationSet: [],
				CandidateReturn: {},
				CandidateEducationSet: [],
				CandidateCertificateSet: [],
				CandidateWorkExperienceSet: [],
				CandidateNotesSet: [],
				CandidateMilitaryStatus: {},
				CandidatePersonalInfo: {
					"Gblnd": "TR",
					"Natio": "TR"
				},
				CandidateAdress: {
					"Land1": "TR"
				},
				CandidateAdditionalInfo: {},
				CandidateResourceReference: {}
			};

			oViewModel.setProperty("/candidateData", oCreate);
		},

		_setSettingsAndListeners: function () {
			var oViewModel = this.getModel("candidateModel");
			var oModel = this.getModel();
			var that = this;
			oModel.setSizeLimit(1000);
			oModel.read("/CandidateCommunicationTypeSet", {
				success: function (oData) {
					oViewModel.setProperty("/CommunicationTypeSettings", oData.results);
				},
				error: function (oError) {
					jQuery.sap.log.error("Communication type fetch error!");
				}
			});

			var oGbdepBinding = new sap.ui.model.Binding(oViewModel, "/candidateData", oViewModel.getContext(
				"/CandidatePersonalInfo/Gbdep"));
			oGbdepBinding.attachChange(function () {
				var sGblnd = oViewModel.getProperty("/candidateData/CandidatePersonalInfo/Gblnd");
				if (sGblnd) {
					var aGbdepFilters = [];
					aGbdepFilters.push(new Filter("Help", FilterOperator.EQ, "Gbdep"));
					aGbdepFilters.push(new Filter("Text", FilterOperator.EQ, sGblnd));
					that.byId("Gbdep_id").getBinding("items").filter(aGbdepFilters);
				}
			});

			var oStateBinding = new sap.ui.model.Binding(oViewModel, "/candidateData", oViewModel.getContext(
				"/CandidateAdress/Land1"));
			oStateBinding.attachChange(function () {
				var sLand1 = oViewModel.getProperty("/candidateData/CandidateAdress/Land1");
				if (sLand1) {
					var aLand1Filters = [];
					aLand1Filters.push(new Filter("Help", FilterOperator.EQ, "State"));
					aLand1Filters.push(new Filter("Text", FilterOperator.EQ, sLand1));
					that.byId("State_id").getBinding("items").filter(aLand1Filters);
				}
			});

		},

		_onCandidateCreateMatched: function () {
			this._createMode = true;
			this._setSettingsAndListeners();
			try {
				this.byId("CreateCandidateWizard").discardProgress(this.byId("CandidatePersonalInfo"));
			} catch (oEx) {
				jQuery.sap.log.error(oEx);
			}

			this._initiateModel();

		},
		_refreshCandidateAttachment: function (sPernr) {
			var aFilterAttachment = [];
			var oAttachmentTable = this.byId("idCandidateAttachmentList"); //Attachment
			try {
				aFilterAttachment.push(new Filter("Tclas", FilterOperator.EQ, "B"));
				aFilterAttachment.push(new Filter("Pernr", FilterOperator.EQ, sPernr));
				oAttachmentTable.getBinding("items").filter(aFilterAttachment, "Application");
			} catch (oEx) {
				jQuery.sap.log.info("Table not rendered properly");
			}
		},
		_onCandidateEditMatched: function (oEvent) {
			var oViewModel = this.getModel("candidateModel");
			var oModel = this.getModel();
			var oCurrentUser = SharedData.getCurrentUser();

			oViewModel.setProperty("/CurrentUser", oCurrentUser);

			var that = this;

			this._createMode = false;
			this._setSettingsAndListeners();

			var sPernr = oEvent.getParameter("arguments").Pernr;
			// attach ve transfer başlangıç
			this._refreshCandidateAttachment(sPernr);
			// attach ve transfer başlangıç	
			this.byId("initIconTab").setSelectedKey("init");
			this.byId("initSubIconTab").setSelectedKey("CandidatePersonalInfo");
			oViewModel.setProperty("/candidateData", this._initModel);
			oViewModel.setProperty("/candidateData/Pernr", sPernr);
			oViewModel.setProperty("/candidateData/Optyp", "S");

			var oFormData = oViewModel.getProperty("/candidateData");

			oViewModel.setProperty("/busy", true);
			oModel.create("/CandidateOperationSet", oFormData, {
				success: function (oData, oResponse) {
					oViewModel.setProperty("/busy", false);
					Object.keys(oData).map(function (item) {
						if (oData[item] !== null && oData[item].hasOwnProperty("results")) {
							oData[item] = oData[item]["results"];
						}
					});
					oViewModel.setProperty("/candidateData", oData);
					oViewModel.refresh(true);
					oModel.refresh(true);
				},
				error: function (oError) {

				}
			});
		},
		onDecideCreateButtonEnabled: function (oData) {
			return true;
		}

	});
});