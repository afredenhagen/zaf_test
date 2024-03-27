/*global location */
sap.ui.define([
	"com/mindsquare/gdmvt/receipt/ushio/controller/BaseController",
	"sap/ui/model/json/JSONModel",
	"com/mindsquare/gdmvt/receipt/ushio/model/formatter"
], function (BaseController, JSONModel, formatter) {
	"use strict";

	return BaseController.extend("com.mindsquare.gdmvt.receipt.ushio.controller.Detail", {

		formatter: formatter,

		/* =========================================================== */
		/* lifecycle methods                                           */
		/* =========================================================== */

		onInit: function () {
			// Model used to manipulate control states. The chosen values make sure,
			// detail page is busy indication immediately so there is no break in
			// between the busy indication for loading the view's meta data
			var oViewModel = new JSONModel({
				busy: false,
				delay: 0,
				lineItemListTitle: this.getResourceBundle().getText("detailLineItemTableHeading")
			});
			this.getRouter().getRoute("object").attachPatternMatched(this._onObjectMatched, this);

			this.setModel(oViewModel, "detailView");

			this.getOwnerComponent().getModel().metadataLoaded().then(this._onMetadataLoaded.bind(this));

		},

		/* =========================================================== */
		/* event handlers                                              */
		/* =========================================================== */

		/**
		 * Event handler when the share by E-Mail button has been clicked
		 * @public
		 */
		onShareEmailPress: function () {
			var oViewModel = this.getModel("detailView");

			sap.m.URLHelper.triggerEmail(
				null,
				oViewModel.getProperty("/shareSendEmailSubject"),
				oViewModel.getProperty("/shareSendEmailMessage")
			);
		},

		/**
		 * Updates the item count within the line item table's header
		 * @param {object} oEvent an event containing the total number of items in the list
		 * @private
		 */
		onListUpdateFinished: function (oEvent) {

			var sTitle,
				iTotalItems = oEvent.getParameter("total"),
				oViewModel = this.getModel("detailView");

			// only update the counter if the length is final
			if (this.byId("lineItemsList").getBinding("items").isLengthFinal()) {
				if (iTotalItems) {
					sTitle = this.getResourceBundle().getText("detailLineItemTableHeadingCount", [iTotalItems]);
				} else {
					//Display 'Line Items' instead of 'Line items (0)'
					sTitle = this.getResourceBundle().getText("detailLineItemTableHeading");
				}
				oViewModel.setProperty("/lineItemListTitle", sTitle);
			}
		},

		/* =========================================================== */
		/* begin: internal methods                                     */
		/* =========================================================== */

		/**
		 * Binds the view to the object path and expands the aggregated line items.
		 * @function
		 * @param {sap.ui.base.Event} oEvent pattern match event in route 'object'
		 * @private
		 */
		_onObjectMatched: function (oEvent) {

			var sObjectId = oEvent.getParameter("arguments").objectId;
			this.getModel().metadataLoaded().then(function () {
				var sObjectPath = this.getModel().createKey("OrderheaderSet", {
					Ebeln: sObjectId
				});
				this._bindView("/" + sObjectPath);
			}.bind(this));
			debugger;
		},

		/**
		 * Binds the view to the object path. Makes sure that detail view displays
		 * a busy indicator while data for the corresponding element binding is loaded.
		 * @function
		 * @param {string} sObjectPath path to the object to be bound to the view.
		 * @private
		 */
		_bindView: function (sObjectPath) {
			// Set busy indicator during view binding
			var oViewModel = this.getModel("detailView");
			debugger;
			// If the view was not bound yet its not busy, only if the binding requests data it is set to busy again
			oViewModel.setProperty("/busy", false);

			this.getView().bindElement({
				path: sObjectPath,
				parameters: {
					expand: "navHeaderItem"
				},
				events: {
					change: this._onBindingChange.bind(this),
					dataRequested: function () {
						oViewModel.setProperty("/busy", true);
					},
					dataReceived: function () {
						oViewModel.setProperty("/busy", false);
					}
				}
			});
			debugger;

		},

		_onBindingChange: function () {

			var oView = this.getView(),
				oElementBinding = oView.getElementBinding();

			// No data for the binding
			if (!oElementBinding.getBoundContext()) {
				this.getRouter().getTargets().display("detailObjectNotFound");
				// if object could not be found, the selection in the master list
				// does not make sense anymore.
				this.getOwnerComponent().oListSelector.clearMasterListSelection();
				return;
			}

			var sPath = oElementBinding.getPath();
			var oResourceBundle = this.getResourceBundle();
			var oObject = oView.getModel().getObject(sPath);

			if (oObject !== undefined) {
				var sObjectId = oObject.Ebeln;
				var sObjectName = oObject.Name1;
				var oViewModel = this.getModel("detailView");

				this.getOwnerComponent().oListSelector.selectAListItem(sPath);

				oViewModel.setProperty("/shareSendEmailSubject",
					oResourceBundle.getText("shareSendEmailObjectSubject", [sObjectId]));
				oViewModel.setProperty("/shareSendEmailMessage",
					oResourceBundle.getText("shareSendEmailObjectMessage", [sObjectName, sObjectId, location.href]));
			} else {
				this.getRouter().navTo("DetailInitial");
			}
		},

		_onMetadataLoaded: function () {
			// Store original busy indicator delay for the detail view

			var iOriginalViewBusyDelay = this.getView().getBusyIndicatorDelay(),
				oViewModel = this.getModel("detailView"),
				oLineItemTable = this.byId("lineItemsList");

			var iOriginalLineItemTableBusyDelay = undefined;

			// Make sure busy indicator is displayed immediately when
			// detail view is displayed for the first time
			oViewModel.setProperty("/delay", 0);
			oViewModel.setProperty("/lineItemTableDelay", 0);

			if (oLineItemTable !== undefined) {
				var iOriginalLineItemTableBusyDelay = oLineItemTable.getBusyIndicatorDelay();

				oLineItemTable.attachEventOnce("updateFinished", function () {
					// Restore original busy indicator delay for line item table
					if (iOriginalLineItemTableBusyDelay !== undefined) {
						oViewModel.setProperty("/lineItemTableDelay", iOriginalLineItemTableBusyDelay);
					}
				});
			}

			// Binding the view will set it to not busy - so the view is always busy if it is not bound
			oViewModel.setProperty("/busy", false);
			// Restore original busy indicator delay for the detail view
			oViewModel.setProperty("/delay", iOriginalViewBusyDelay);
		},
		_getDialog: function () {

			if (!this._oDialog) {
				this._oDialog = sap.ui.xmlfragment("com.mindsquare.gdmvt.receipt.ushio.view.changeQuantityDialog", this.getView().getController());
				this.getView().addDependent(this._oDialog);
			}
			return this._oDialog;
		},

		onDetailPress: function (oEvent) {
			var oCtx = oEvent.getSource().getBindingContext();
			var oModel = oCtx.getModel();
			this._getDialog().setBindingContext(oCtx);
			this._getDialog().open();
			//Felder clearen/Standard-Einstellungen
			sap.ui.getCore().byId("labelCount").setValue("");
			sap.ui.getCore().byId("tabDialog").setSelectedKey("quantity"); //Tab quantity auswählen
			var xchpf = this._getDialog().getBindingContext().getObject().Xchpf;
			if (xchpf) { //Boobinentab bei Chargenpflicht anzeigen
				sap.ui.getCore().byId("tabFilterBobine").setVisible(xchpf);
				//Wenn Bobine gewählt, standardmäu00dfig 1 Etikett drucken
				oModel.setProperty("LabelCount", "1", oCtx);
			} else {
				sap.ui.getCore().byId("tabFilterBobine").setVisible(xchpf);
			}

			//Elikz: standardmäu00dfig = true setzen 
			oModel.setProperty("Elikz", true, oCtx);

			//@TODO Erstes Label in Context ablegen
			var sKey = sap.ui.getCore().byId("selectLabel").getItems()[0].getKey();
			oModel.setProperty("LabelName", sKey, oCtx);
			//Wenn Dialog das zweite Mal geöffnet wird KztxtBatch einfu00fcgen
			var sKztxtBatch = oCtx.getObject().KztxtBatch;
			// if (sKztxtBatch !== "" || sKztxtBatch !== undefined) {
			// 	var aKztxt = sKztxtBatch.split(" | ");
			// 	sap.ui.getCore().byId("iCableReel").setValue(aKztxt[0]);
			// 	//sap.ui.getCore().byId("iParamFrom").setValue(aKztxt[1]);
			// 	//sap.ui.getCore().byId("iParamTo").setValue(aKztxt[2]);
			// }

			var sLicha = oModel.getProperty(oCtx.sPath + '/Licha');
			if (sLicha) {
				sap.ui.getCore().byId("ibatchExt").setValue(sLicha);
			}

			var sBatch = oModel.getProperty(oCtx.sPath + '/Charg');
			if (sBatch) {
				sap.ui.getCore().byId("iCableReel").setValue(sBatch);
			}
		},

		onBtnDeletePress: function (oEvent) {
			var oView = this._oDialog;
			var oModel = oView.getModel();
			var oCtx = oView.getBindingContext();
			var sPath = oCtx.getPath();

			oModel.setProperty(sPath + "/MengeR", "");

			//sap.ui.getCore().byId("iMengeR").setNumber("0");
		},

		onBtnNumberPress: function (oEvent) {
			var oView = this._oDialog;
			var oModel = oView.getModel();
			var oCtx = oView.getBindingContext();
			var sPath = oCtx.getPath();

			var sInput = oEvent.getSource().getText();
			var sMengeR = oModel.getProperty(sPath + "/MengeR");
			//var oMengeR = sap.ui.getCore().byId("iMengeR");
			//var sMengeR = oMengeR.getNumber();

			if (sInput === ".") {
				if (sMengeR.includes(".")) {
					this.showMessageErrorDialog("Ungu00fcltige Eingabe");
				} else {

					oModel.setProperty(sPath + "/MengeR", sMengeR + sInput);
					//oMengeR.setNumber(sMengeR + sInput);
				}
			} else {
				if (sMengeR === "0") {
					oModel.setProperty(sPath + "/MengeR", sMengeR + sInput);
					//oMengeR.setNumber(sInput);
				} else {
					oModel.setProperty(sPath + "/MengeR", sMengeR + sInput);
					//oMengeR.setNumber(sMengeR + sInput);
				}
			}
		},

		onBtnSubmitDialogPress: function () {
			debugger;
			var oCtx = this._getDialog().getBindingContext();
			var oModel = oCtx.getModel();

			//oModel.setProperty("MengeR", sap.ui.getCore().byId("iMengeR").getNumber(), oCtx);

			//Verbrauchsdatum
			var sMonth = sap.ui.getCore().byId("iMonth").getValue();
			var sYear = sap.ui.getCore().byId("iYear").getValue();
			var sDate;
			if (sMonth !== "" && sMonth !== undefined) {
				sDate = this.handleDate("month", sMonth);
			}
			if (sYear !== "" && sYear !== undefined) {
				sYear = this.handleDate("year", sYear);
				if (sDate === "") {
					sDate = sYear;
				} else {
					sDate = sDate + "/" + sYear;
				}
			}
			//Felder clearen
			sap.ui.getCore().byId("iYear").setValue("");
			sap.ui.getCore().byId("iMonth").setValue("");
			oModel.setProperty("Date", sDate, oCtx);
			//LabelCount pru00fcfen
			if (isNaN(oCtx.getProperty("LabelCount"))) {
				sap.ui.getCore().byId("labelCount").fireChangeEvent();
				return;
			}

			//Bobinen-Daten auslesen
			if (sap.ui.getCore().byId("tabFilterBobine").getVisible()) { //Wenn Bobineneingabe sichtbar war
				var sbatchExt = sap.ui.getCore().byId("ibatchExt").getValue();
				var sCableReel = sap.ui.getCore().byId("iCableReel").getValue(); // batch
				// USHIOIT-173: Input value Production code to variable
				var sProductioncode = sap.ui.getCore().byId("iProductioncode").getValue();
				//var sParamFrom = sap.ui.getCore().byId("iParamFrom").getValue();
				//var sParamTo = sap.ui.getCore().byId("iParamTo").getValue();
				// if (sbatchExt === "") { //Wenn Chargen-Felder nicht gefu00fcllt
				// 	this.showMessageErrorDialog("Bitte Chargeninformationen pflegen.");
				// } else {

				oModel.setProperty("Licha", sbatchExt, oCtx);
				oModel.setProperty("Charg", sCableReel, oCtx);
				// USHIOIT-173: Set oModel Property for Productioncode
				oModel.setProperty("CustomParameter2", sProductioncode, oCtx);

				sap.ui.getCore().byId("iCableReel").setValue("");
				sap.ui.getCore().byId("ibatchExt").setValue("");
				// USHIOIT-173: Clear input field for Productioncode
				sap.ui.getCore().byId("iProductioncode").setValue("");
				this.closeDialog();
				// }
				//Felder clearen

				//sap.ui.getCore().byId("iParamFrom").setValue("");
				//sap.ui.getCore().byId("iParamTo").setValue("");
			} else {
				this.closeDialog();
			}
		},

		onBtnCancelPress: function () {
			this.closeDialog();
		},

		closeDialog: function () {
			if (this._oDialog) {
				this._oDialog.close();
				this._oDialog.destroy(true);
				delete this._oDialog;
			}
			// var sBindingPath = oDialog.getBindingPath();
			// //oDialog.destroy();
			// oDialog.unbindElement(sBindingPath);
		},

		onPOItemUpdateFinished: function (oData) { //ggf. in Expressionbinding ändern
			var aItems = oData.getSource().getItems();
			for (var i = 0; i < aItems.length; i++) {
				if (aItems[i].getBindingContext().getProperty("Xchpf")) { //Artikel ist Chargenpflichtig
					aItems[i].setHighlight(sap.ui.core.MessageType.Error);
				} else {
					aItems[i].setHighlight(sap.ui.core.MessageType.None);
				}
			}
		},

		checkBatchData: function () {
			var aItems = this.getView().byId("postionList").getItems();
			var check = true;
			debugger;
			for (var i = 0; i < aItems.length; i++) {
				var oItem = aItems[i].getBindingContext().getObject();
				if (oItem.Selected === true && oItem.Xchpf === true && oItem.KztxtBatch === "") { //Artikel ist Chargenpflichtig UND ausgewählt
					check = false;
				}
			}
			return check;
		},

		checkMandatoryFields: function () {
			var oView = this.getView();
			var oCtx = oView.getBindingContext();
			var oLifnr = oCtx.getObject();
			//var sLfsnr1 = oLifnr.Lfsnr1;
			var sBukrs = oLifnr.Bukrs;

			// Mandatory Check
			var check = true;

			//if (sLfsnr1 === "" || sLfsnr1 === undefined || sLfsnr1 === null) {
			//	check = false;
			//}

			if (sBukrs === "" || sBukrs === undefined || sBukrs === null) {
				check = false;
			}

			return check;
		},

		checkPositionSelected: function () {
			// Check if at least one item is selected
			var oView = this.getView();
			var oList = oView.byId("postionList");
			var aItems = oList.getItems();

			var oCtxItem, bSelected;
			var check = false;
			for (var i = 0; i < aItems.length; i++) {

				oCtxItem = aItems[i].getBindingContext();
				bSelected = oCtxItem.getProperty("Selected");

				if (bSelected === true) {
					check = true;
				}
			}
			return check;
		},

		onBtnSubmitReceipPressNew: function () {
			if (this.checkMandatoryFields() !== true) {
				// Pflichtfeldpru00fcfung
				this.showMessageErrorDialog(this.getResourceBundle().getText("errorMandatoryFields"));
			} else if (this.checkPositionSelected() !== true) {
				this.showMessageErrorDialog(this.getResourceBundle().getText("errorNoPositionSelected"));
			} else {
				// Update durchfu00fchren
				//Wenn Chargendaten gefu00fcllt
				var oMessageManager = sap.ui.getCore().getMessageManager();
				oMessageManager.removeAllMessages();

				// Variablen
				var oView = this.getView();
				var oModel = oView.getModel();

				// Header
				var oCtx = oView.getBindingContext();
				var oHeader = oCtx.getObject();
				var sPathHeader = oCtx.getPath();

				// Navigationseigenschaf aus Objekt entfernen
				delete oHeader.navHeaderItem;

				// Promises initialisieren
				var aPromises = [];
				var oPromise;

				oPromise = new Promise(function (resolve, reject) {
					// Update des Kopfes durchfu00fchren
					oModel.update(sPathHeader, oHeader, {
						success: function (oData, oResponse) {
							resolve(oResponse);
						}.bind(this),
						error: function (oError) {
							reject(oError);
						}.bind(this)
					});
				});

				// Update des Kopfes dem Promise-Array hinzufu00fcgen
				aPromises.push(oPromise);

				// Items
				var oList = oView.byId("postionList");
				var aItems = oList.getItems();

				var sPathItem, oCtxItem, bSelected, oDataItem;

				for (var i = 0; i < aItems.length; i++) {
					// Variablen auslesen
					oCtxItem = aItems[i].getBindingContext();
					bSelected = oCtxItem.getProperty("Selected");

					// Pru00fcfen, ob das Item selektiert wurde
					if (bSelected === true) {
						// Informationen zum Item auslesen
						sPathItem = aItems[i].getBindingContextPath();
						oDataItem = oCtxItem.getObject();
						debugger;
						oPromise = new Promise(function (resolve, reject) {
							// Positionsupdate durchfu00fchren
							oModel.update(sPathItem, oDataItem, {
								success: function (oData, oResponse) {
									resolve(oResponse);
								}.bind(this),
								error: function (oError) {
									reject(oError);
								}.bind(this)
							});
							debugger;
						});

						// Update des Items dem Promise-Array hinzufu00fcgen
						aPromises.push(oPromise);
					}
				}
				debugger;
				Promise.all(aPromises).then(
					function (aHeaders) {
						// alle Promises erfolgreich durchlaufen

						// Variablen auslesen
						var oViewSuccess = this.getView();

						// Busy-Modus beenden
						oViewSuccess.byId("postionList").setBusy(false);

						// Erfolgsmeldung ausgeben
						// this.showSuccessMessage(oResponse);
						this.fnShowSuccessMessageSave(aHeaders);

						oViewSuccess.getModel().refresh();
						//this.onNavBack();
						this.selectFirstEntryOnMasterList(); //Erstes Item auf Bestellliste auswählen

						//Dialog clearen
						this.closeDialog();
					}.bind(this),
					function (oError) {
						// Busy Indicator ausblenden
						sap.ui.core.BusyIndicator.hide();

						//Errorhandling
						var aMMData = oMessageManager.getMessageModel().getData();

						if (aMMData.length === 0) {
							// Falls im MessageManager keine Nachrichten -> aus der Ru00fcckgabe laden
							aMMData = this.getErrorDetailMessages(oError);
						}
						debugger;
						if (aMMData.length > 1) {
							this.showMessageErrorDialog(aMMData[1].message);
						} else if (aMMData.length !== 0) {
							this.showMessageErrorDialog(aMMData[0].message);
						} else {
							var sDefaultText = this.getResourceBundle().getText("errorDefaultText");
							this.showMessageErrorDialog(sDefaultText);
						}
					}.bind(this)
				);
				debugger;
			}
		},

		onBtnSubmitReceipPress: function () {
			if (this.checkMandatoryFields() !== true) {
				this.showMessageErrorDialog(this.getResourceBundle().getText("errorMandatoryFields"));
			} else if (this.checkBatchData() !== true) {
				this.showMessageErrorDialog(this.getResourceBundle().getText("errorChargeninformation"));
			} else {
				//Wenn Chargendaten gefu00fcllt
				var oMessageManager = sap.ui.getCore().getMessageManager();
				oMessageManager.removeAllMessages();
				// Variablen
				var oView = this.getView();
				var oModel = oView.getModel();

				// Header
				var oCtx = oView.getBindingContext();
				var oHeader = oCtx.getObject();
				var sPathHeader = oCtx.getPath();

				delete oHeader.navHeaderItem;

				oModel.update(sPathHeader, oHeader, {
					success: function (oData, response) {
						this.getView().byId("postionList").setBusy(false);
						this.showSuccessMessage(response);
						this.getView().getModel().refresh();
						this.onNavBack();
						this.selectFirstEntryOnMasterList(); //Erstes Item auf Bestellliste auswählen
						//Dialog clearen
						this.closeDialog();

					}.bind(this),
					error: function (oError) {
						sap.ui.core.BusyIndicator.hide();
						//Errorhandling
						var aMMData = oMessageManager.getMessageModel().getData();
						debugger;
						if (aMMData.length === 0) {
							// Falls im MessageManager keine Nachrichten -> aus der Ru00fcckgabe laden
							aMMData = this.getErrorDetailMessages(oError);
						}

						if (aMMData.length > 1) {
							this.showMessageErrorDialog(aMMData[1].message);
						} else if (aMMData.length !== 0) {
							this.showMessageErrorDialog(aMMData[0].message);
						} else {
							var sDefaultText = this.getResourceBundle().getText("errorDefaultText");
							this.showMessageErrorDialog(sDefaultText);
						}
					}.bind(this)
				});

				// Items
				var aItems = this.getView().byId("postionList").getItems();
				for (var i = 0; i < aItems.length; i++) {
					if (aItems[i].getBindingContext().getObject().Selected === true) {
						var sPath = aItems[i].getBindingContextPath();
						var oData = aItems[i].getBindingContext().getObject();
						oModel.update(sPath, oData, {
							success: function (oData, response) {
								this.getView().byId("postionList").setBusy(false);
								this.showSuccessMessage(response);
								this.getView().getModel().refresh();
								this.onNavBack();
								this.selectFirstEntryOnMasterList(); //Erstes Item auf Bestellliste auswählen
								//Dialog clearen
								this.closeDialog();

							}.bind(this),
							error: function (oError) {
								sap.ui.core.BusyIndicator.hide();
								//Errorhandling
								var oMMData = oMessageManager.getMessageModel().getData();
								if (oMMData.length > 1) {
									this.showMessageErrorDialog(oMessageManager.getMessageModel().getData()[1].message);
								} else if (oMMData.length !== 0) {
									this.showMessageErrorDialog(oMessageManager.getMessageModel().getData()[0].message);
								} else {
									this.showMessageErrorDialog("ERROR");
								}
							}.bind(this)
						});
					}
				}
			}
		},

		onLabelCountChange: function (oEvent) {
			var oElement = oEvent.getSource();
			if (isNaN(oElement.getValue())) { //ist keine Nummer
				oElement.setValueState(sap.ui.core.ValueState.Error);
				oElement.setValueStateText(this.getResourceBundle().getText("errorLabelCount"));
			} else {
				oElement.setValueState(sap.ui.core.ValueState.None);
			}
		},

		itemFactory: function () {
			return sap.ui.xmlfragment("com.mindsquare.gdmvt.receipt.ushio.view.factoryItem", this.getView().getController());
		},

		selectFirstEntryOnMasterList: function () {
			// Variablen laden
			var oAppStorage = this.getAppStorage();

			// List-Id auslesen
			var sListId = oAppStorage.getProperty("/MasterListId");

			// List-Objekt laden
			var oList = sap.ui.getCore().byId(sListId);

			// Erste Item fokussieren
			var aItems = oList.getItems();

			if (aItems.length > 0) {
				// Erste Item markieren
				oList.setSelectedItem(aItems[0]);

			} else {
				// Leere Seite zeigen
				this.getView().navTo("DetailInitial");
			}
		},

		fnShowSuccessMessageSave: function (aHeaders) {
			// Nachrichten auslesen
			//var aMessages = sap.ui.getCore().getMessageManager().getMessageModel().getData();
			var oSapMessageJson, oSapMessage;
			var sMessage;

			for (var i = 0; i < aHeaders.length; i++) {
				oSapMessageJson = aHeaders[i].headers["sap-message"];

				if (oSapMessageJson !== undefined) {
					// Nachricht auslesen
					oSapMessage = JSON.parse(oSapMessageJson);
					sMessage = oSapMessage.message;

					break;
				}
			}

			if (sMessage !== undefined) {
				// Nachricht ausgeben
				sap.m.MessageToast.show(sMessage, {
					duration: 3000,
					width: "15em", // default
					my: "center bottom", // default
					at: "center bottom", // default
					of: window, // default
					offset: "0 -100", // default 0 0
					collision: "fit fit", // default
					onClose: null, // default
					autoClose: true, // default
					animationTimingFunction: "ease", // default
					animationDuration: 1000, // default
					closeOnBrowserNavigation: true // default
				});
			}

		},

		onChangeMengeR: function (oEvent) {
			// Variablen laden
			var oSource = oEvent.getSource();
			var oCtx = oSource.getBindingContext();
			var sPath = oCtx.getPath();
			var oView = this.getView();
			var oModel = oView.getModel();

			// MengeH MengeR Menge
			var sMenge = oModel.getProperty(sPath + "/Menge");
			var sMengeH = oModel.getProperty(sPath + "/MengeH");
			var sMengeR = oModel.getProperty(sPath + "/MengeR");
			var bFehler = false;

			try {
				// Integer parsen
				sMenge = parseInt(sMenge, 10);
				sMengeH = parseInt(sMengeH, 10);
				sMengeR = parseInt(sMengeR, 10);
			} catch (e) {
				bFehler = true;
			}

			if (sMengeH + sMengeR < sMenge && bFehler === false) {
				// Es ist noch nicht die gesamte Menge geliefert -> endgeliefert nicht gesetzt
				oModel.setProperty(sPath + "/Elikz", false);
			} else {
				// Es ist die gesamte Menge geliefert -> endgeliefert gesetzt
				oModel.setProperty(sPath + "/Elikz", true);
			}
		}

	});
});