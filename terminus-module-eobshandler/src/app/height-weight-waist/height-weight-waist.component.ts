//BEGIN LICENSE BLOCK 
//Interneuron Terminus

//Copyright(C) 2025  Interneuron Limited

//This program is free software: you can redistribute it and/or modify
//it under the terms of the GNU General Public License as published by
//the Free Software Foundation, either version 3 of the License, or
//(at your option) any later version.

//This program is distributed in the hope that it will be useful,
//but WITHOUT ANY WARRANTY; without even the implied warranty of
//MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.

//See the
//GNU General Public License for more details.

//You should have received a copy of the GNU General Public License
//along with this program.If not, see<http://www.gnu.org/licenses/>.
//END LICENSE BLOCK 
import { Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';

import { ApirequestService } from '../services/apirequest.service';
import { SharedDataContainerService } from '../services/shared-data-container.service';
import { AuthenticationService } from '../services/authentication.service';
import { CorePersonmeasurements, Gcsobservations } from '../models/person.model';
import { UpsertTransactionManager } from '../services/upsert-transaction-manager.service';
import { Graph2d, Graph2dOptions } from 'vis-timeline/standalone';
import { v4 as uuidv4 } from 'uuid';
import { filter, filterParams, filterparam, filters, orderbystatement, selectstatement } from '../models/filter.model';
import moment from 'moment';
import { AppService, BadgeNames } from '../services/app.service';
import { SubjectsService } from '../services/subjects.service';
import { Subscription } from 'rxjs';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';

@Component({
  selector: 'app-height-weight-waist',
  templateUrl: './height-weight-waist.component.html',
  styleUrl: './height-weight-waist.component.css'
})
export class HeightWeightWaistComponent implements OnDestroy {

  public today = new Date();
  public mindate = new Date();
  public maxTime = new Date();
  public minTime = new Date();
  RecordHistory: any;
  showEdit = false;
  showDelete = false
  defaultMonitoringFrequencyData: any;
  monitoringFrequencyData: any;
  showpatientrefuselink = true;
  patientrefuse = false;
  Choosenfilterdate = new Date();
  reasonforRefusal = "";
  chartConfig: { chartHeading: string; UOM: string; };
  observationtype: { observationtype: string; RBAC: boolean; };
  messageSuccess: boolean;
  ShowHistory: boolean;
  LatestRecordSelected = true
  selectedObservation: any
  OthereReason

  monitoringFrequencyHistoryData = []
  subscriptions: Subscription = new Subscription();
  height: any;
  weight: any;
  waistcircumferance: any;
  bmi: any;
  waistToHeight: any;
  showError: boolean;
  showErrormessage: string;
  measurementsdetails: any;
  measurementsistoryData: any[];
  RBACK_Edit = false
  editshowError: boolean;
  editshowErrormessage: string;
  previousMegerments :any
  measurementsdetailshistory: any;
  showEditHistory: boolean;
  showGraph = false;
  private graph2d: any;
  private graph2dWeight: any;
  private graph2dHeight: any;
  private graph2dWaist: any;
  private graph2dWaist2HeightRatio: any;
  private graph2dBMI: any;
  currentRecordedFrequencyAndReason: any;
  latestHeightRecordedDate = null;
  latestWeightRecordedDate
  latestWaistRecordedDate = null;
  
  constructor(public subject: SubjectsService, public modalService: BsModalService, public bsGraphModalRef: BsModalRef, private apiRequest: ApirequestService, private sharedData: SharedDataContainerService, private authService: AuthenticationService, public appService: AppService) {
  
  this.RBACK_Edit=this.appService.AuthoriseAction('eobs_edit_height_weight_circumference')
    this.chartConfig = { 'chartHeading': 'Blood Glucose Graph', 'UOM': 'mmol/L' }
    this.observationtype = {
      'observationtype': 'heightWeightWaist',
      'RBAC': this.appService.AuthoriseAction('eobs_set_monitoring_freq_height_weight_circumference')
    }

    this.selectedObservation = {}
    this.init()
  }

  ChoosenfilterdateChange(selectvalue: any) {

  }
  ngOnDestroy(): void {
    this.subscriptions.unsubscribe()
  }
  init() {
    this.Choosenfilterdate = new Date();
    this.mindate = new Date()
    this.mindate.setHours(this.mindate.getHours() - 8)
    this.minTime = this.mindate;

    this.minTime.setMinutes(this.minTime.getMinutes(), 0, 0)

    this.maxTime = new Date();
    this.maxTime.setMinutes(this.maxTime.getMinutes() + 1, 0, 0)
    this.subscriptions.add(this.apiRequest.postRequest(`${this.appService.baseURI}/GetBaseViewListByPost/terminus_getpersonmeasurementsdetails`, this.createFilter())
      .subscribe(
        (measurementsdetails) => {
          this.measurementsistoryData = [];
          this.measurementsdetailshistory = [];
          this.monitoringFrequencyHistoryData = []
          this.measurementsdetails = measurementsdetails
          this.measurementsdetailshistory = JSON.parse(JSON.stringify(measurementsdetails));
          this.measurementsdetailshistory.sort((a, b) => new Date(a.observationtime).getTime() - new Date(b.observationtime).getTime());
         

          let prehight = null
          let preweight = null
          let prewaistt = null
          for (let obk of this.measurementsdetailshistory) {
            obk._weightadded = false
            obk._heightadded = false
            obk._waistadded = false
            if (!obk.isdeleted) {
              if (preweight && !obk.weight) {
                obk.weight = preweight
                obk._weightadded = true
              }
              else {
                this.latestWeightRecordedDate = obk.observationtime
              }
              preweight = obk.weight
              // ----------------------------------------------
              if (prehight && !obk.height) {
                obk.height = prehight
                obk._heightadded = true
              }
              else {
                this.latestHeightRecordedDate = obk.observationtime
              }
              prehight = obk.height
              // ----------------------------------------------
              if (prewaistt && !obk.waistcircumferance) {
                obk.waistcircumferance = prewaistt
                obk._waistadded = true
              }
              else {
                this.latestWaistRecordedDate = obk.observationtime
              }
              prewaistt = obk.waistcircumferance
            }

          }
          this.measurementsdetails.sort((b, a) => new Date(a.observationtime).getTime() - new Date(b.observationtime).getTime());
          this.measurementsdetailshistory.sort((b, a) => new Date(a.observationtime).getTime() - new Date(b.observationtime).getTime());
          let nondeletedrecords = JSON.parse(JSON.stringify(this.measurementsdetailshistory));
          nondeletedrecords = nondeletedrecords.filter(x => !x.isdeleted)
          nondeletedrecords.sort((b, a) => new Date(a.observationtime).getTime() - new Date(b.observationtime).getTime());
          this.previousMegerments = new CorePersonmeasurements();
          this.defaultMonitoringFrequencyData = null
   
          this.currentRecordedFrequencyAndReason = ''
          if (nondeletedrecords.length > 0) {
            this.previousMegerments = nondeletedrecords[0]
            if(!this.previousMegerments.isstopped) {
              let reson=this.previousMegerments.frequencyreason == "Other" ?this.previousMegerments.frequencyreasonother  : this.previousMegerments.frequencyreason  ;
              this.currentRecordedFrequencyAndReason = '- every '+ this.previousMegerments.frequency   + ' days - ' + reson
            }
            else {
              this.currentRecordedFrequencyAndReason = '  Monitoring Stopped';
            }
            this.defaultMonitoringFrequencyData = {
              'frequency_entered': nondeletedrecords[0].frequency,
              'frequencyunit_entered': nondeletedrecords[0].frequencyunit,
              'isstop': nondeletedrecords[0].isstopped,
              'ispause': null,
              'monitoringnotrequired': null,
              "frequency_reason": nondeletedrecords[0].frequencyreason,
              "frequency_reason_other": nondeletedrecords[0].frequencyreasonother
            }
          }
          else {
            this.defaultMonitoringFrequencyData = {

              'isstop': true,
              "frequency_reason": "Other",
              "frequency_reason_other": "Monitoring not started"


            }
          }
      
        

          this.loadChart()
        },

      )
    )
  }
  DeleteCancelClick() {
    if (this.selectedObservation.reasonforamend == "Recorded for the wrong patient") {
      this.selectedObservation.reasonforamend = "Entered in error"
    }
    this.showDelete = false;
    this.showEdit = true;
  }
  receivehistoryViewerData(data: any, clickedAction: string) {
    if (clickedAction == "showHistory") {
      let Record = this.measurementsdetails.find(x => x.personmeasurements_id == data.personmeasurements_id)
      this.selectedObservation = JSON.parse(JSON.stringify(Record));
      this.RecordHistory = JSON.parse( this.selectedObservation.__history);
      this.RecordHistory.sort((a, b) => new Date(b._createddate).getTime() - new Date(a._createddate).getTime());
      this.showEditHistory = true;
    }
    else {
      let Record = this.measurementsdetails.find(x => x.personmeasurements_id == data.personmeasurements_id)
      if (Record.personmeasurements_id == this.measurementsdetails[0].personmeasurements_id) {
        this.LatestRecordSelected = true


        if (Record.isstopped) {
          this.defaultMonitoringFrequencyData = {
            'frequency_entered': null,
            'frequencyunit_entered': null,
            'monitoringnotrequired': true,
            'isstop': true,
            "frequency_reason": Record.frequencyreason,
            "frequency_reason_other": Record.frequencyreasonother
          }
        }
        else {

          this.defaultMonitoringFrequencyData = {
            'frequency_entered': Record.frequency,
            'frequencyunit_entered': Record.frequencyunit,
            'monitoringnotrequired': false,
            'isstop': false,
            "frequency_reason": Record.frequencyreason,
            "frequency_reason_other": Record.frequencyreasonother

          }
        }
      }
      else {
        this.LatestRecordSelected = false;

      }
      this.selectedObservation = JSON.parse(JSON.stringify(Record));
      this.selectedObservation.reasonforchange = "Entered in error";
      this.editshowError = false;

      this.editshowErrormessage = "";
      this.showEdit = true;
    }
  }


  inputCheckheight(event) {
    let height = event.target.value.toString();
    let [leftDigits, rightDigits] = height.split('.');
    let newLeftDigit;
    let newRightDigit;
    if (leftDigits.length > 3) {
      newLeftDigit = leftDigits.slice(0, 3);
    } else {
      newLeftDigit = leftDigits;
    }
    if (rightDigits && rightDigits.length > 2) {
      newRightDigit = rightDigits.slice(0, 2);
    } else if (rightDigits) {
      newRightDigit = rightDigits
    }
    let updatedHeight = Number(newLeftDigit + (newRightDigit ? ('.' + newRightDigit) : ''));
    if (updatedHeight == 0) {
      updatedHeight = undefined;
    }

    setTimeout(() => {
      if (updatedHeight == 0) {
        updatedHeight = undefined;
      }
      this.height = updatedHeight;
      this.waistToHeight = this.calculateWtH(this.waistcircumferance, this.height).toString();
      this.bmi = this.calculateBMI(this.weight, this.height).toString();

    }, 0);

  }

  inputCheckweight(event) {
    let weight = event.target.value.toString();
    let [leftDigits, rightDigits] = weight.split('.');
    let newLeftDigit;
    let newRightDigit;
    if (leftDigits.length > 3) {
      newLeftDigit = leftDigits.slice(0, 3);
    } else {
      newLeftDigit = leftDigits;
    }
    if (rightDigits && rightDigits.length > 2) {
      newRightDigit = rightDigits.slice(0, 2);
    } else if (rightDigits) {
      newRightDigit = rightDigits
    }
    let updatedvalue = Number(newLeftDigit + (newRightDigit ? ('.' + newRightDigit) : ''));
    if (updatedvalue == 0) {
      updatedvalue = undefined;
    }

    setTimeout(() => {
      if (updatedvalue == 0) {
        updatedvalue = undefined;
      }
      this.weight = updatedvalue;
      this.bmi = this.calculateBMI(this.weight, this.height).toString();
    }, 0);

  }

  inputCheckWaistcircumferance(event) {
    let waisttohight = event.target.value.toString();
    let [leftDigits, rightDigits] = waisttohight.split('.');
    let newLeftDigit;
    let newRightDigit;
    if (leftDigits.length > 3) {
      newLeftDigit = leftDigits.slice(0, 3);
    } else {
      newLeftDigit = leftDigits;
    }
    if (rightDigits && rightDigits.length > 2) {
      newRightDigit = rightDigits.slice(0, 2);
    } else if (rightDigits) {
      newRightDigit = rightDigits
    }
    let updatedvalue = Number(newLeftDigit + (newRightDigit ? ('.' + newRightDigit) : ''));
    if (updatedvalue == 0) {
      updatedvalue = undefined;
    }

    setTimeout(() => {
      if (updatedvalue == 0) {
        updatedvalue = undefined;
      }
      this.waistcircumferance = updatedvalue;

      this.waistToHeight = this.calculateWtH(this.waistcircumferance, this.height).toString();
    }, 0);

  }

  showeModelditdiscardMethod(e: any) {

  }
  receiveMonitoringFrequencyData(event) {

    this.monitoringFrequencyData = event;
    console.log('Received data from child:', event);
    let fres = parseInt(this.monitoringFrequencyData.frequency_entered, 10);
    this.monitoringFrequencyData.frequency_entered = isNaN(fres) || +fres == 0 ? "null" : fres.toString();
    this.monitoringFrequencyData = event;


  }
  patientrefuseChange() {
    if (!this.patientrefuse) {
      this.showpatientrefuselink = true;
    }
  }



  saveObservation() {

    this.showError = false;

    this.showErrormessage = "";

    // if (
    //   this.patientrefuse === false &&
    //   (this.height === null || this.height === undefined || this.height === "") &&
    //   (this.weight === null || this.weight === undefined || this.weight === "") &&
    //   (this.waistcircumferance === null || this.waistcircumferance === undefined || this.waistcircumferance === "")
    // ) {
    //   this.showError = true;
    //   this.showErrormessage = "Please enter Measurements "
    //   return;
    // }
    if (this.patientrefuse && (!this.reasonforRefusal || this.reasonforRefusal.trim() == "")) {
      this.showError = true;
      this.showErrormessage = "Please Enter Patient Refuse Reason."
      return;
    }
    if ((isNaN(this.monitoringFrequencyData.monitoringFrequency) || this.monitoringFrequencyData.monitoringFrequency == 0 || this.monitoringFrequencyData.frequency_entered == "null" || this.monitoringFrequencyData.frequency_entered == null) && !this.monitoringFrequencyData.isstop) {
      this.showError = true;
      this.showErrormessage = "Please enter Monitoring Frequency"
      return;
    }
    // if ((this.monitoringFrequencyData.frequencyunit_entered == null || this.monitoringFrequencyData.frequencyunit_entered == "null") && !this.monitoringFrequencyData.isstop) {
    //   this.showError = true;
    //   this.showErrormessage = "Please enter Monitoring Frequency Unit"
    //   return;
    // }
    // else {
    //   // let validateTo7Days = this.appService.validationForMonitoringFrequencyNotAllowed7Days(this.monitoringFrequencyData.frequency_entered, this.monitoringFrequencyData.frequencyunit_entered);
    //   // if (validateTo7Days) {
    //   //   this.showErrormessage = "Monitoring frequency cannot be greater than 7 days";
    //   //   return;
    //   // }
    // }
    if (this.monitoringFrequencyData.frequency_reason == 'null') {
      this.showError = true;
      this.showErrormessage = "Please enter Monitoring Frequency Reason"
      return;
    }
    else {
      if (this.monitoringFrequencyData.frequency_reason == 'Other' && this.monitoringFrequencyData.frequency_reason_other.trim() == "") {
        this.showError = true;
        this.showErrormessage = "Please enter Other Reason"
        return;
      }
    }
    this.messageSuccess = true;

    let Personmeasurements = new CorePersonmeasurements();
    Personmeasurements.personmeasurements_id = uuidv4();
    Personmeasurements.personid = this.appService.personId
    Personmeasurements.encounterid = this.appService.encounter.encounter_id
    Personmeasurements.observationtime = this.appService.getDateTimeinISOFormat(this.Choosenfilterdate)
    let dt = new Date()
    Personmeasurements.createdon = this.appService.getDateTimeinISOFormat(dt);
    Personmeasurements.lastmodifiedon = this.appService.getDateTimeinISOFormat();
    Personmeasurements.completedby = this.appService.loggedInUserName
    Personmeasurements.height = null
    Personmeasurements.weight = null
    Personmeasurements.waistcircumferance = null
    Personmeasurements.bmi = null
    Personmeasurements.waisttoheight = null

    if (this.patientrefuse) {
      Personmeasurements.patientrefused = true
      Personmeasurements.reasonforpatientrefused = this.reasonforRefusal
    }
    else {
      if (!(this.height === null || this.height === undefined || this.height === ""))
        Personmeasurements.height = this.height.toString();
      if (!(this.weight === null || this.weight === undefined || this.weight === ""))
        Personmeasurements.weight = this.weight.toString();
      if (!(this.waistcircumferance === null || this.waistcircumferance === undefined || this.waistcircumferance === ""))
        Personmeasurements.waistcircumferance = this.waistcircumferance.toString();
      if (!(this.waistToHeight === null || this.waistToHeight === undefined || this.waistToHeight === "0"))
        Personmeasurements.waisttoheight = this.waistToHeight
      if (!(this.bmi === null || this.bmi === undefined || this.bmi === "0"))
        Personmeasurements.bmi = this.bmi.toString();
    }




    Personmeasurements.frequency = this.monitoringFrequencyData.frequency_entered
    Personmeasurements.frequencyinhour = this.monitoringFrequencyData.monitoringFrequency
    Personmeasurements.frequencyunit = "days";

    Personmeasurements.frequencyreason = this.monitoringFrequencyData.frequency_reason

    if (this.monitoringFrequencyData.frequency_reason == 'Other') {
      Personmeasurements.frequencyreasonother = this.monitoringFrequencyData.frequency_reason_other
    } else {
      Personmeasurements.frequencyreasonother = null;
    }

    if (this.monitoringFrequencyData.isstop) {
      Personmeasurements.isstopped = true
      Personmeasurements.frequency =null
      Personmeasurements.frequencyunit =null
    }
    else {
      Personmeasurements.isstopped = null
    }

    var upsertManager = new UpsertTransactionManager();
    upsertManager.beginTran(this.appService.baseURI, this.apiRequest);
    Object.keys(Personmeasurements).map((e) => { if (e.startsWith("_")) delete Personmeasurements[e]; })


    upsertManager.addEntity('core', "personmeasurements", JSON.parse(JSON.stringify(Personmeasurements)));
    upsertManager.save((resp) => {
      console.log(resp)
      this.messageSuccess = true;
    
      this.waistcircumferance=null
      this.weight=null
      this.height=null
      this.reasonforRefusal=null
      this.patientrefuse=false
      this.waistToHeight=null
      this.bmi=null
      this.showpatientrefuselink=true;
      this.init()
      this.subject.frameworkEvent.next("BADGEACTION_UPDATEBADGE_" + BadgeNames.heightWeightwaist)
      setTimeout(() => {
        this.messageSuccess = false;
        this.OthereReason = ""
      }, 2000);

    },
      (error) => {
        this.messageSuccess = false;
        this.showError = true;
        this.showErrormessage = error
        console.log(error)

      }
    );

  }

  CloseModuel(){
    this.subject.closeModal.next('close modal');
  }
  saveEditObservation() {

    this.editshowError = false;

    this.editshowErrormessage = "";

    // if (
    //   this.selectedObservation.patientrefused === false &&
    //   (this.selectedObservation.height === null || this.selectedObservation.height === undefined || this.selectedObservation.height === "") &&
    //   (this.selectedObservation.weight === null || this.selectedObservation.weight === undefined || this.selectedObservation.weight === "") &&
    //   (this.selectedObservation.waistcircumferance === null || this.selectedObservation.waistcircumferance === undefined || this.selectedObservation.waistcircumferance === "")
    // ) {
    //   this.editshowError = true;
    //   this.editshowErrormessage = "Please enter Measurements "
    //   return;
    // }
    if (this.selectedObservation.patientrefused && (! this.selectedObservation.reasonforpatientrefused || this.selectedObservation.reasonforpatientrefused.trim() == "")) {
      this.editshowError = true;
      this.editshowErrormessage = "Please Enter Patient Refuse Reason."
      return;
    }
    if (this.LatestRecordSelected && (isNaN(this.monitoringFrequencyData.monitoringFrequency) || this.monitoringFrequencyData.monitoringFrequency == 0 || this.monitoringFrequencyData.frequency_entered == "null" || this.monitoringFrequencyData.frequency_entered == null) && !this.monitoringFrequencyData.isstop) {
      this.editshowError = true;
      this.editshowErrormessage = "Please enter Monitoring Frequency"
      return;
    }
    // if (this.LatestRecordSelected && (this.monitoringFrequencyData.frequencyunit_entered == null || this.monitoringFrequencyData.frequencyunit_entered == "null") && !this.monitoringFrequencyData.isstop) {
    //   this.editshowError = true;
    //   this.editshowErrormessage = "Please enter Monitoring Frequency Unit"
    //   return;
    // }
    // else {
    //   // let validateTo7Days = this.appService.validationForMonitoringFrequencyNotAllowed7Days(this.monitoringFrequencyData.frequency_entered, this.monitoringFrequencyData.frequencyunit_entered);
    //   // if (this.LatestRecordSelected && validateTo7Days) {
    //   //   this.editshowError = true;
    //   //   this.editshowErrormessage = "Monitoring frequency cannot be greater than 7 days";
    //   //   return;
    //   // }
    // }
    if (this.LatestRecordSelected && this.monitoringFrequencyData.frequency_reason == 'null') {
      this.editshowError = true;
      this.editshowErrormessage = "Please enter Monitoring Frequency Reason"
      return;
    }
    else {
      if (this.LatestRecordSelected && this.monitoringFrequencyData.frequency_reason == 'Other' && this.monitoringFrequencyData.frequency_reason_other.trim() == "") {
        this.editshowError = true;
        this.editshowErrormessage = "Please enter Other Reason"
        return;
      }
    }
    if (!this.selectedObservation.patientrefused && this.selectedObservation.reasonforchange == "Other" && (!this.selectedObservation.reasonforchangeother || this.selectedObservation.reasonforchangeother.trim() == "")) {
      this.editshowError = true;
       this.editshowErrormessage = "Please enter Other Reason"
     return;
   }




    this.selectedObservation.lastmodifiedon = this.appService.getDateTimeinISOFormat();
    this.selectedObservation.completedby = this.appService.loggedInUserName
    this.selectedObservation.isamended=true;

    if (this.selectedObservation.patientrefused) {
      this.selectedObservation.height = null
      this.selectedObservation.weight = null
      this.selectedObservation.waistcircumferance = null
      this.selectedObservation.bmi = null
      this.selectedObservation.waisttoheight = null
    }
    else {
      this.selectedObservation.patientrefused = false;
      this.selectedObservation.reasonforpatientrefused=""
      this.selectedObservation.height =this.selectedObservation.height ? this.selectedObservation.height.toString() : null 
      this.selectedObservation.weight = this.selectedObservation.weight ? this.selectedObservation.weight.toString() : null 
      this.selectedObservation.waistcircumferance = this.selectedObservation.waistcircumferance ? this.selectedObservation.waistcircumferance.toString() : null 
      this.selectedObservation.bmi =this.selectedObservation.bmi ? this.selectedObservation.bmi.toString() : null 
      this.selectedObservation.waisttoheight =this.selectedObservation.waisttoheight ? this.selectedObservation.waisttoheight.toString() : null 
    }
    if (this.LatestRecordSelected) {
      this.selectedObservation.frequency = this.monitoringFrequencyData.frequency_entered
      this.selectedObservation.frequencyinhour = this.monitoringFrequencyData.monitoringFrequency
      this.selectedObservation.frequencyunit = "days";

      this.selectedObservation.frequencyreason = this.monitoringFrequencyData.frequency_reason

      if (this.monitoringFrequencyData.frequency_reason == 'Other') {
        this.selectedObservation.frequencyreasonother = this.monitoringFrequencyData.frequency_reason_other
      } else {
        this.selectedObservation.frequencyreasonother = null;
      }

      if (this.monitoringFrequencyData.isstop) {
        this.selectedObservation.isstopped = true
        this.selectedObservation.frequency = null
        this.selectedObservation.frequencyunit =null
      }
      else {
        this.selectedObservation.isstopped = null
      }

    }

    var upsertManager = new UpsertTransactionManager();
    upsertManager.beginTran(this.appService.baseURI, this.apiRequest);
    Object.keys(this.selectedObservation).map((e) => { if (e.startsWith("_")) delete this.selectedObservation[e]; })


    upsertManager.addEntity('core', "personmeasurements", JSON.parse(JSON.stringify(this.selectedObservation)));
    upsertManager.save((resp) => {
      console.log(resp)
      this.showEdit=false;
      this.showDelete=false;
      this.selectedObservation=null;
      this.init()

      this.subject.frameworkEvent.next("BADGEACTION_UPDATEBADGE_" + BadgeNames.heightWeightwaist)


    },
      (error) => {
        this.messageSuccess = false;
        this.showError = true;
        this.showErrormessage = error
        console.log(error)

      }
    );

  }
  Deleteobservation(){
    if (this.selectedObservation.reasonforchange == "Other" && (!this.selectedObservation.reasonforchangeother || this.selectedObservation.reasonforchangeother.trim() == "")) {
       this.editshowError = true;
        this.editshowErrormessage = "Please enter Other Reason"
      return;
    }
    let Record  = this.measurementsdetails.find(x => x.personmeasurements_id == this.selectedObservation.personmeasurements_id)

    Record.isdeleted = true;
  
    Record.reasonforchange = this.selectedObservation.reasonforchange
    Record.reasonforchangeother = this.selectedObservation.reasonforchangeother
    this.selectedObservation = JSON.parse(JSON.stringify(Record));
    this.selectedObservation.lastmodifiedon = this.appService.getDateTimeinISOFormat();
    this.selectedObservation.completedby = this.appService.loggedInUserName
    this.selectedObservation.isamended=true;

    var upsertManager = new UpsertTransactionManager();
    upsertManager.beginTran(this.appService.baseURI, this.apiRequest);
    Object.keys(this.selectedObservation).map((e) => { if (e.startsWith("_")) delete this.selectedObservation[e]; })


    upsertManager.addEntity('core', "personmeasurements", JSON.parse(JSON.stringify(this.selectedObservation)));
    upsertManager.save((resp) => {
      console.log(resp)
      this.showEdit=false;
      this.showDelete=false;
      this.selectedObservation=null;
      this.init()

      this.subject.frameworkEvent.next("BADGEACTION_UPDATEBADGE_" + BadgeNames.heightWeightwaist)


    },
      (error) => {
        this.messageSuccess = false;
        this.showError = true;
        this.showErrormessage = error
        console.log(error)

      }
    );

  }
  calculateBMI(weight: number, height: number): string {
    if (!weight || !height) {
      return ""; // If weight or height is 0, return 0
    }

    return parseFloat(((weight * 10000) / (height * height)).toFixed(1)).toString(); // BMI formula with rounding
  }
  getDateTime(date = new Date()): string {


    let year = date.getFullYear();
    let month = (date.getMonth() + 1);
    let day = date.getDate();
    let hrs = date.getHours();
    let mins = date.getMinutes();
    let secs = date.getSeconds();
    let msecs = date.getMilliseconds();

    let returndate = (year + "-" + (month < 10 ? "0" + month : month) + "-" + (day < 10 ? "0" + day : day) +
      "T" + (hrs < 10 ? "0" + hrs : hrs) + ":" + (mins < 10 ? "0" + mins : mins) + ":" + (secs < 10 ? "0" + secs : secs) + "." + (msecs < 10 ? "00" + msecs : (msecs < 100 ? "0" + msecs : msecs)));

    return returndate;
  }
  calculateWtH(circumf: number, height: number): string {
    if (!circumf || !height) {
      return ""; // If either value is 0, return 0
    }

    return parseFloat((circumf / height).toFixed(2)).toString(); // Otherwise, divide and round to 2 decimal places
  }

  createFilter() {
    let condition = "personid = @personid and encounterid = @encounterid";
    //let condition = "personid = @personid";

    let f = new filters()
    f.filters.push(new filter(condition));

    let pm = new filterParams();
    pm.filterparams.push(new filterparam("personid", this.appService.personId));
    pm.filterparams.push(new filterparam("encounterid", this.appService.encounter.encounter_id));

    let select = new selectstatement("SELECT *");

    let orderby = new orderbystatement("ORDER BY _sequenceid desc");

    let body = [];
    body.push(f);
    body.push(pm);
    body.push(select);
    body.push(orderby);

    return JSON.stringify(body);
  }

  selectinputCheckheight(event) {
    let height = event.target.value.toString();
    let [leftDigits, rightDigits] = height.split('.');
    let newLeftDigit;
    let newRightDigit;
    if (leftDigits.length > 3) {
      newLeftDigit = leftDigits.slice(0, 3);
    } else {
      newLeftDigit = leftDigits;
    }
    if (rightDigits && rightDigits.length > 2) {
      newRightDigit = rightDigits.slice(0, 2);
    } else if (rightDigits) {
      newRightDigit = rightDigits
    }
    let updatedHeight = Number(newLeftDigit + (newRightDigit ? ('.' + newRightDigit) : ''));
    if (updatedHeight == 0) {
      updatedHeight = undefined;
    }

    setTimeout(() => {
      if (updatedHeight == 0) {
        updatedHeight = undefined;
      }
      this.selectedObservation.height = updatedHeight;
      this.selectedObservation.waisttoheight = this.calculateWtH(this.selectedObservation.waistcircumferance, this.selectedObservation.height).toString();
      this.selectedObservation.bmi = this.calculateBMI(this.selectedObservation.weight, this.selectedObservation.height).toString();

    }, 0);

  }

  selectinputCheckweight(event) {
    let weight = event.target.value.toString();
    let [leftDigits, rightDigits] = weight.split('.');
    let newLeftDigit;
    let newRightDigit;
    if (leftDigits.length > 3) {
      newLeftDigit = leftDigits.slice(0, 3);
    } else {
      newLeftDigit = leftDigits;
    }
    if (rightDigits && rightDigits.length > 2) {
      newRightDigit = rightDigits.slice(0, 2);
    } else if (rightDigits) {
      newRightDigit = rightDigits
    }
    let updatedvalue = Number(newLeftDigit + (newRightDigit ? ('.' + newRightDigit) : ''));
    if (updatedvalue == 0) {
      updatedvalue = undefined;
    }

    setTimeout(() => {
      if (updatedvalue == 0) {
        updatedvalue = undefined;
      }
      this.selectedObservation.weight = updatedvalue;
      this.selectedObservation.bmi = this.calculateBMI(this.selectedObservation.weight, this.selectedObservation.height).toString();
    }, 0);

  }

  selectinputCheckWaistcircumferance(event) {
    let waisttohight = event.target.value.toString();
    let [leftDigits, rightDigits] = waisttohight.split('.');
    let newLeftDigit;
    let newRightDigit;
    if (leftDigits.length > 3) {
      newLeftDigit = leftDigits.slice(0, 3);
    } else {
      newLeftDigit = leftDigits;
    }
    if (rightDigits && rightDigits.length > 2) {
      newRightDigit = rightDigits.slice(0, 2);
    } else if (rightDigits) {
      newRightDigit = rightDigits
    }
    let updatedvalue = Number(newLeftDigit + (newRightDigit ? ('.' + newRightDigit) : ''));
    if (updatedvalue == 0) {
      updatedvalue = undefined;
    }

    setTimeout(() => {
      if (updatedvalue == 0) {
        updatedvalue = undefined;
      }
      this.selectedObservation.waistcircumferance = updatedvalue;
      this.selectedObservation.waisttoheight = this.calculateWtH(this.selectedObservation.waistcircumferance, this.selectedObservation.height).toString();
    }, 0);

  }

  loadChart() {
    // const items = [];
    const itemsHeight = [];
    const itemsWeight = [];
    const itemsWaistCircumference = [];
    const itemsBMI = [];
    const itemsWaist2HeightRatio = [];
    this.measurementsdetails.forEach(element => {
      if (element.height)
        itemsHeight.push({ x: moment(element.observationtime).toDate(), y: element.height, label: { content: element.height } })
      if (element.weight)
        itemsWeight.push({ x: moment(element.observationtime).toDate(), y: element.weight, label: { content: element.weight } })
      if (element.waistcircumferance)
        itemsWaistCircumference.push({ x: moment(element.observationtime).toDate(), y: element.waistcircumferance, label: { content: element.waistcircumferance } })
      if (element.bmi)
        itemsBMI.push({ x: moment(element.observationtime).toDate(), y: element.bmi, label: { content: element.bmi } })
      if (element.waisttoheight)
        itemsWaist2HeightRatio.push({ x: moment(element.observationtime).toDate(), y: element.waisttoheight, label: { content: element.waisttoheight } })
    });

    // Configuration for the Graph2d
    // const options: Graph2dOptions = {
    //   dataAxis: {
    //     showMinorLabels: false,
    //     left: {
    //       title: {
    //         text: 'Total Score'
    //       }
    //     }
    //   },
    //   start: moment().subtract(1, 'days').toDate(),
    //   end: moment().add(1, 'days').toDate(),
    //   drawPoints: {
    //     style: 'circle' // 'square' also possible
    //   },

    // };

    const optionsheight: Graph2dOptions = {
      zoomMin: 1000 * 60 * 60 * 24 * 7, // Minimum zoom level: 1 hour
      zoomMax: 1000 * 60 * 60 * 24 * 7 * 4, 
      height: '200px', // Set height (px or %)
      dataAxis: {
        showMinorLabels: false,
        left: {
          title: {
            text: 'Height'
          }
        }
      },
      start: moment().subtract(1, 'days').toDate(),
      end: moment().add(1, 'days').toDate(),
      drawPoints: {
        style: 'circle' // 'square' also possible
      },

    };
    const optionsweight: Graph2dOptions = {
      zoomMin: 1000 * 60 * 60 * 24 * 7, // Minimum zoom level: 1 hour
      zoomMax: 1000 * 60 * 60 * 24 * 7 * 4, 
      height: '200px', // Set height (px or %)
      dataAxis: {
        showMinorLabels: false,
        left: {
          title: {
            text: 'Weight'
          }
        }
      },
      start: moment().subtract(1, 'days').toDate(),
      end: moment().add(1, 'days').toDate(),
      drawPoints: {
        style: 'circle' // 'square' also possible
      },

    };

    const optionswaistcircumference: Graph2dOptions = {
      zoomMin: 1000 * 60 * 60 * 24 * 7, // Minimum zoom level: 1 hour
      zoomMax: 1000 * 60 * 60 * 24 * 7 * 4, 
      height: '200px', // Set height (px or %)
      dataAxis: {
        showMinorLabels: false,
        left: {
          title: {
            text: 'Waist Circumference'
          }
        }
      },
      start: moment().subtract(1, 'days').toDate(),
      end: moment().add(1, 'days').toDate(),
      drawPoints: {
        style: 'circle' // 'square' also possible
      },

    };

    const optionswaistoheightratio: Graph2dOptions = {
      zoomMin: 1000 * 60 * 60 * 24 * 7, // Minimum zoom level: 1 hour
      zoomMax: 1000 * 60 * 60 * 24 * 7 * 4, 
      height: '200px', // Set height (px or %)
      dataAxis: {
        showMinorLabels: false,
        left: {
          title: {
            text: 'Waist to height Ratio'
          }
        }
      },
      start: moment().subtract(1, 'days').toDate(),
      end: moment().add(1, 'days').toDate(),
      drawPoints: {
        style: 'circle' // 'square' also possible
      },

    };

    const optionsbmi: Graph2dOptions = {
      zoomMin: 1000 * 60 * 60 * 24 * 7, // Minimum zoom level: 1 hour
      zoomMax: 1000 * 60 * 60 * 24 * 7 * 4, 
      height: '200px', // Set height (px or %)
      dataAxis: {
        showMinorLabels: false,
        left: {
          title: {
            text: 'BMI'
          }
        }
      },
      start: moment().subtract(1, 'days').toDate(),
      end: moment().add(1, 'days').toDate(),
      drawPoints: {
        style: 'circle' // 'square' also possible
      },

    };
    // var visualization = document.getElementById("visualization");
    var visualizationWeight = document.getElementById("visualizationWeight");
    var visualizationHeight = document.getElementById("visualizationHeight");
    var visualizationBMI = document.getElementById("visualizationBMI");
    var visualizationWaist2HeightRatio = document.getElementById("visualizationWaist2HeightRatio");
    var visualizationWaistCircumference = document.getElementById("visualizationWaistCircumference");
    if (visualizationWeight) {
      visualizationWeight.innerHTML = ""
      visualizationHeight.innerHTML = ""
      visualizationBMI.innerHTML = ""
      visualizationWaistCircumference.innerHTML = ""
      visualizationWaist2HeightRatio.innerHTML = ""

      // Create a Graph2d visualizationVerbal  visualizationMotot
      // this.graph2d = new Graph2d(visualization, items, options);
      this.graph2dWeight = new Graph2d(visualizationWeight, itemsWeight, optionsweight);
      this.graph2dHeight = new Graph2d(visualizationHeight, itemsHeight, optionsheight);
      this.graph2dBMI = new Graph2d(visualizationBMI, itemsBMI, optionsbmi);
      this.graph2dWaist2HeightRatio = new Graph2d(visualizationWaist2HeightRatio, itemsWaist2HeightRatio, optionswaistoheightratio);
      this.graph2dWaist = new Graph2d(visualizationWaistCircumference, itemsWaistCircumference, optionswaistcircumference);
    }
  }

zoomIn(): void {
    const range = this.graph2dWeight.getWindow();
    const interval = range.end - range.start;
    
    this.graph2dBMI.setWindow({
      start: moment(range.start).add(interval * 0.2, 'milliseconds').toDate(),
      end: moment(range.end).subtract(interval * 0.2, 'milliseconds').toDate()
    });
    this.graph2dHeight.setWindow({
      start: moment(range.start).add(interval * 0.2, 'milliseconds').toDate(),
      end: moment(range.end).subtract(interval * 0.2, 'milliseconds').toDate()
    });
    this.graph2dWaist2HeightRatio.setWindow({
      start: moment(range.start).add(interval * 0.2, 'milliseconds').toDate(),
      end: moment(range.end).subtract(interval * 0.2, 'milliseconds').toDate()
    });
    this.graph2dWaist.setWindow({
      start: moment(range.start).add(interval * 0.2, 'milliseconds').toDate(),
      end: moment(range.end).subtract(interval * 0.2, 'milliseconds').toDate()
    });
    this.graph2dWeight.setWindow({
      start: moment(range.start).add(interval * 0.2, 'milliseconds').toDate(),
      end: moment(range.end).subtract(interval * 0.2, 'milliseconds').toDate()
    });

  }

  zoomOut(): void {
    const range = this.graph2dWeight.getWindow();
    const interval = range.end - range.start;
    
    this.graph2dBMI.setWindow({
      start: moment(range.start).add(interval * 0.2, 'milliseconds').toDate(),
      end: moment(range.end).subtract(interval * 0.2, 'milliseconds').toDate()
    });
    this.graph2dHeight.setWindow({
      start: moment(range.start).subtract(interval * 0.2, 'milliseconds').toDate(),
      end: moment(range.end).add(interval * 0.2, 'milliseconds').toDate()
    });
    this.graph2dWaist2HeightRatio.setWindow({
      start: moment(range.start).add(interval * 0.2, 'milliseconds').toDate(),
      end: moment(range.end).subtract(interval * 0.2, 'milliseconds').toDate()
    });
    this.graph2dWaist.setWindow({
      start: moment(range.start).add(interval * 0.2, 'milliseconds').toDate(),
      end: moment(range.end).subtract(interval * 0.2, 'milliseconds').toDate()
    });
    this.graph2dWeight.setWindow({
      start: moment(range.start).subtract(interval * 0.2, 'milliseconds').toDate(),
      end: moment(range.end).add(interval * 0.2, 'milliseconds').toDate()
    });
  }

}
