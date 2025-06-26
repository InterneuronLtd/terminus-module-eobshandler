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
import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';


import { ApirequestService } from '../services/apirequest.service';
import { Observation, Observationevent, Posturalbloodpressure } from '../models/person.model';
import { SharedDataContainerService } from '../services/shared-data-container.service';
import { AuthenticationService } from '../services/authentication.service';
import { v4 as uuidv4 } from 'uuid';
import * as moment from 'moment';
import { UpsertTransactionManager } from '../services/upsert-transaction-manager.service';

import { filter, filterParams, filterparam, filters, orderbystatement, selectstatement } from '../models/filter.model';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { AppService, BadgeNames } from '../services/app.service';
import { SubjectsService } from '../services/subjects.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-blood-pressure',
  templateUrl: './blood-pressure.component.html',
  styleUrls: ['./blood-pressure.component.css']
})
export class BloodPressureComponent implements OnInit, OnDestroy {
  username: any;
  editshowerrormessage: string = ""
  editshowerror: boolean = false
  subscriptions: Subscription = new Subscription();
  constructor(public subject: SubjectsService, private apiRequest: ApirequestService, private sharedData: SharedDataContainerService, private authService: AuthenticationService, public appService: AppService) {

    this.mindate.setHours(this.mindate.getHours() - 8)
    this.minTime = this.mindate;
    // this.minTime.setHours(9, 0, 0); // Sets minTime to 9:00 AM

    this.maxTime = new Date();
    this.maxTime.setMinutes(this.maxTime.getMinutes() + 1, 0, 0)


    this.encounterId = this.appService.encounter.encounter_id
    this.init();

  }
  ngOnDestroy(): void {
    this.subscriptions.unsubscribe()
  }
  rowForHistoryViewer = [
    {
      'id': 'datestarted',
      'fieldName': 'Observation Time'
    },
    {
      'id': 'sbpsitting',
      'fieldName': 'Systolic'
    },
    {
      'id': 'dbpsitting',
      'fieldName': 'Diastolic'
    },
    {
      'id': 'sbpstanding',
      'fieldName': 'Systolic'
    },
    {
      'id': 'dbpstanding',
      'fieldName': 'Diastolic'
    },
    {
      'id': 'createdby',
      'fieldName': 'Recorded By'
    },
    {
      'id': 'changevalue',
      'fieldName': 'Postural Change'
    },
    {
      'id': 'reason',
      'fieldName': 'Reason for Refusal'
    },

    {
      'id': 'action',
      'fieldName': ''
    },
  ]
  showerror = false
  showerrormessage = ""
  messageSuccess = false;
  showEdit = false;
  showDelete = false;
  ShowHistory = false;
  showEditHistory = false;
  showeditdiscard = false
  showeModelditdiscard = false

  systolicsitting: number;
  systolicstanding: number;
  diastolicsitting: number;
  diastolicstanding: number;
  encounterId = "";
  posturalbloodpressureDetail: any;
  Obsevation: any;
  obsevationevent: any;
  // posturalbloodpressureHistory: any
  selectedposturalbloodpressure: any;
  RecordHistory: any;
  Choosenfilterdate = new Date();
  Choosenfiltertime: any;
  OthereReason = "";
  public today = new Date();
  public mindate = new Date();
  public maxTime = new Date();
  public minTime = new Date();
  monitoringFrequencyHistoryData = [];

  patientrefuse = false;
  showpatientrefuselink = true;
  reasonforRefusal = "";

  standingvalueError = false
  sittingvalueError = false
  changevalue=0;
  changevalueedit=0;
  editstandingvalueError = false
  editsittingvalueError = false


  init() {
    this.Choosenfilterdate = new Date();
    this.mindate = new Date()
    this.mindate.setHours(this.mindate.getHours() - 8)
    this.minTime = this.mindate;

    this.minTime.setMinutes(this.minTime.getMinutes(), 0, 0)

    this.maxTime = new Date();
    this.maxTime.setMinutes(this.maxTime.getMinutes() + 1, 0, 0)
    this.subscriptions.add(this.apiRequest.postRequest(`${this.appService.baseURI}/GetBaseViewListByPost/terminus_posturalbloodpressuredetail`, this.createFilter())
      .subscribe(
        (posturalbloodpressure) => {

          this.posturalbloodpressureDetail = posturalbloodpressure;
          this.posturalbloodpressureDetail.sort((b, a) => new Date(a.observationtime).getTime() - new Date(b.observationtime).getTime());
          this.monitoringFrequencyHistoryData = [];
          for (let Obj of this.posturalbloodpressureDetail) {
            let observationevent = JSON.parse(Obj.__observationevent)
            this.monitoringFrequencyHistoryData.push(
              {
                'datestarted': moment(Obj.observationtime),
                'sbpsitting': Obj.patientrefused == true ? "N/A" : Obj.sbpsitting,
                'dbpsitting': Obj.patientrefused == true ? "N/A" : Obj.dbpsitting,


                'sbpstanding': Obj.patientrefused == true ? "N/A" : Obj.sbpstanding,
                'dbpstanding': Obj.patientrefused == true ? "N/A" : Obj.dbpstanding,
                'createdby': Obj.createdby,
                'changevalue': Obj.patientrefused == true ? "Patient Refused" : Math.abs(Obj.changevalue) + " mm/Hg",
                'action': '',
                'observationevent_id': Obj.obsevationeventsitting,
                'eventcorrelationid': Obj.eventcorrelationid,
                'isamended': Obj.isamended,
                'isdeleted': Obj.isdeleted,
                'reason': Obj.reasonforpatientrefused,
                'clickedAction': '',
                'showEdit': this.appService.AuthoriseAction('eobs_Edit_postural_blood_pressure'),
                'showHistory': true,
                'componentCalled': "blood_pressure"
              })
          }
          this.getBloodPressureFromObservationchart();
          //  this.posturalbloodpressureHistory=JSON.parse(this.posturalbloodpressureDetail.filter)
        },

      )
    )
  }

  getBloodPressureFromObservationchart(){
        this.subscriptions.add(this.apiRequest.postRequest(`${this.appService.baseURI}/GetBaseViewListByPost/eobs_getbloodpressuredetail`, this.createFilterobservation())
      .subscribe(
        (posturalbloodpressure) => {

        //  this.posturalbloodpressureDetail = posturalbloodpressure;
         posturalbloodpressure.sort((b, a) => new Date(a.observationtime).getTime() - new Date(b.observationtime).getTime());
         
          for (let Obj of posturalbloodpressure) {
            // let observationevent = JSON.parse(Obj.__observationevent)
            if(!Obj.systolicsitting || Obj.systolicsitting == 'null') {
              continue
            }
            this.monitoringFrequencyHistoryData.push(
              {
                'datestarted': moment(Obj.datestarted),
                'sbpsitting': Obj.systolicsitting,
                'dbpsitting': Obj.diastolicsitting,


                'sbpstanding': Obj.systolicstanding,
                'dbpstanding': Obj.diastolicstanding,
                'createdby': Obj.createdby,
                'changevalue': !Obj.posturalchange ? "" : Math.abs(Obj.posturalchange) + " mm/Hg",
                'action': '',
                'observationevent_id': Obj.observationevent_id,
                'eventcorrelationid':'',
                'isamended':false,
                'isdeleted':false,
                'reason':'',
                'clickedAction': '',
                'showEdit': false,
                'showHistory': true,
                'componentCalled': "blood_pressure"
              })
          }
           this.monitoringFrequencyHistoryData.sort((b, a) => new Date(a.datestarted).getTime() - new Date(b.datestarted).getTime());
          //  this.posturalbloodpressureHistory=JSON.parse(this.posturalbloodpressureDetail.filter)
        },

      )
    )
  }
  ngOnInit(): void {

    this.username = this.appService.loggedInUserName

  }
  inputCheck(event, control = '') {
    let value = event.target.value.toString();

    let [leftDigits, rightDigits] = value.split('.');
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
    newLeftDigit = newLeftDigit.toString();
    let updatedvalue = Number(newLeftDigit);
    if (updatedvalue == 0) {
      updatedvalue = undefined;
    }

    setTimeout(() => {
      if (control == 'systolicsitting') {
        this.systolicsitting = updatedvalue
      }
      if (control == 'diastolicsitting') {
        this.diastolicsitting = updatedvalue
      }
      if (control == 'systolicstanding') {
        this.systolicstanding = updatedvalue
      }
      if (control == 'diastolicstanding') {
        this.diastolicstanding = updatedvalue
      }
      this.changevalue = Math.abs( this.systolicsitting - this.systolicstanding)
      if( this.selectedposturalbloodpressure){
      this.changevalueedit = Math.abs( this.selectedposturalbloodpressure.sbpsitting - this.selectedposturalbloodpressure.sbpstanding)
      }

    }, 0);
  }

  SaveObsevation() {
    this.showerror = false;
    this.sittingvalueError = false
    this.standingvalueError = false
    this.showerrormessage = ""

    if (!this.patientrefuse) {
      if (this.systolicsitting < 50 || this.systolicsitting > 300 || this.systolicstanding < 50 ||  this.systolicstanding > 300) {
        this.showerror = true;
        this.showerrormessage = "The allowed range for Systolic is 50 to 300."
        return
      }
    }
    if (!this.patientrefuse) {
      if (this.diastolicsitting < 10 || this.diastolicsitting > 150 || this.diastolicsitting < 10 ||  this.diastolicsitting > 150) {
        this.showerror = true;
        this.showerrormessage = "The allowed range for Diastolic is 10 to 150."
        return
      }
    }
    if (!this.patientrefuse) {
      if (!this.systolicsitting || !this.systolicstanding || !this.diastolicsitting || !this.diastolicsitting) {
        this.showerror = true;
        this.showerrormessage = " Please Enter	Systolic And Diastolic values."
        return
      }
    }

    if (!this.patientrefuse) {
      if (this.systolicsitting <= this.diastolicsitting) {
        this.showerror = true;
        this.sittingvalueError = true
        this.showerrormessage = "Diastolic cannot be equal to or greater than Systolic."
        return
      }
    }
    if (!this.patientrefuse) {
      if (this.systolicstanding <= this.diastolicstanding) {
        this.showerror = true;
        this.standingvalueError = true
        this.showerrormessage = "Diastolic cannot be equal to or greater than Systolic."
        return
      }
    }

    if (this.patientrefuse && this.reasonforRefusal.trim() == "") {
      this.showerror = true;
      this.showerrormessage = "Please enter reason for refusal."
      return
    }


    //this.Choosenfilterdate.setTime(this.Choosenfiltertime.getTime()) 
    this.messageSuccess = true;
    let eventcorrelationid = uuidv4();
    let loggedInUser = this.appService.loggedInUserName

    var upsertManager = new UpsertTransactionManager();
    upsertManager.beginTran(this.appService.baseURI, this.apiRequest);

    let newObsEventSitting = this.createObservationEvent(eventcorrelationid, "95229151-31e6-4996-955e-32dd43c0d281", "BPSittingLying");
    let newObsEventStanding = this.createObservationEvent(eventcorrelationid, "0cf5654c-277f-4dec-b5de-c0c0e3488634", "BPStanding");

    let posturalbloodpressure = new Posturalbloodpressure(uuidv4(), this.appService.personId, this.encounterId, loggedInUser,
      newObsEventStanding.observationevent_id, newObsEventSitting.observationevent_id, this.getDateTime(this.Choosenfilterdate), this.patientrefuse == true ? null : this.systolicstanding, this.patientrefuse == true ? null : this.systolicsitting,
      this.patientrefuse == true ? null : this.diastolicstanding, this.patientrefuse == true ? null : this.diastolicsitting, "", false, Math.abs(this.systolicsitting - this.systolicstanding), eventcorrelationid, this.getDateTime(), this.patientrefuse, this.reasonforRefusal, false, this.getDateTime(this.Choosenfilterdate))

    if (!this.patientrefuse) {
      let Obssystolicsitting = this.createObsevation(newObsEventSitting, eventcorrelationid, "af5dc4a2-3e40-4e09-9d4f-3ddb137158de", this.systolicsitting)
      let Obsdiastolicsitting = this.createObsevation(newObsEventSitting, eventcorrelationid, "e2d6d5fa-2a38-448f-9e06-9a3e6b532bb5", this.diastolicsitting)
      let Obspositionsitting = this.createObsevation(newObsEventSitting, eventcorrelationid, "d1ca3666-6b13-4c87-b4db-7141c0ead85e", "SittingOrLying")



      let Obssystolicstanding = this.createObsevation(newObsEventStanding, eventcorrelationid, "af5dc4a2-3e40-4e09-9d4f-3ddb137158de", this.systolicstanding)
      let Obsdiastolicstanding = this.createObsevation(newObsEventStanding, eventcorrelationid, "e2d6d5fa-2a38-448f-9e06-9a3e6b532bb5", this.diastolicstanding)
      let Obspositionstanding = this.createObsevation(newObsEventStanding, eventcorrelationid, "d1ca3666-6b13-4c87-b4db-7141c0ead85e", "Standing");

      upsertManager.addEntity('core', 'observation', JSON.parse(JSON.stringify(Obssystolicsitting)));
      upsertManager.addEntity('core', 'observation', JSON.parse(JSON.stringify(Obsdiastolicsitting)));
      upsertManager.addEntity('core', 'observation', JSON.parse(JSON.stringify(Obspositionsitting)));
      upsertManager.addEntity('core', 'observation', JSON.parse(JSON.stringify(Obssystolicstanding)));
      upsertManager.addEntity('core', 'observation', JSON.parse(JSON.stringify(Obsdiastolicstanding)));
      upsertManager.addEntity('core', 'observation', JSON.parse(JSON.stringify(Obspositionstanding)));
    }



    upsertManager.addEntity('core', 'observationevent', JSON.parse(JSON.stringify(newObsEventSitting)));
    upsertManager.addEntity('core', 'observationevent', JSON.parse(JSON.stringify(newObsEventStanding)));



    upsertManager.addEntity('core', "posturalbloodpressure", JSON.parse(JSON.stringify(posturalbloodpressure)));
    upsertManager.save((resp) => {
      console.log(resp)
      this.systolicsitting = this.systolicstanding = this.diastolicsitting = this.diastolicstanding = null;
      this.patientrefuse = false;
      this.reasonforRefusal = ""
      this.ShowHistory = false;
      this.OthereReason = ""
      this.subject.frameworkEvent.next("BADGEACTION_UPDATEBADGE_" + BadgeNames.BloodGlucose)

      setTimeout(() => {                           // <<<---using ()=> syntax
        this.messageSuccess = false;
      }, 2000);

      this.init();

    },
      (error) => {
        this.messageSuccess = false;
        this.showerror = true;
        this.showerrormessage = error
        console.log(error)

      }
    );

  }

  createObsevation(Observationevent: Observationevent, eventcorrelationid: any, observationtype_id: string, value) {

    let loggedInUser = this.appService.loggedInUserName

    return new Observation(
      uuidv4(), "", "", Observationevent.datefinished,
      Observationevent.observationevent_id, observationtype_id,
      "", value.toString(), false, loggedInUser, eventcorrelationid, null);
  }

  createObservationEvent(eventcorrelationid: any, eventType: string, eventTypetext: string) {

    let loggedInUser = this.appService.loggedInUserName

    return new Observationevent(
      uuidv4(), this.appService.personId, this.getDateTime(this.Choosenfilterdate), this.getDateTime(this.Choosenfilterdate), loggedInUser,
      this.encounterId, false, 168, "", null, null, loggedInUser, null, null, null, null, null, eventType, eventcorrelationid, null, null, null, eventTypetext, null, this.patientrefuse, this.reasonforRefusal);
  }

  EditRecord(Record: any) {
    this.selectedposturalbloodpressure = JSON.parse(JSON.stringify(Record));
    this.selectedposturalbloodpressure.resonforchange = "Entered in error";
    this.changevalueedit = Math.abs( this.selectedposturalbloodpressure.sbpsitting - this.selectedposturalbloodpressure.sbpstanding)
    this.showEdit = true;
  }
  saveEditorDelete(action: string) {
    let loggedInUser = ""
    this.editshowerror = false;
    this.editstandingvalueError = false
    this.editsittingvalueError = false
    this.editshowerrormessage = ""
    if (action == "Delete" && this.selectedposturalbloodpressure.resonforchange == "Other" && this.OthereReason.trim() == "") {
      this.editshowerror = true;
      this.editshowerrormessage = "Please Enter Other Reason."
      return
    }
    if (action != "Delete") {
      this.editshowerror = false;
      this.editshowerrormessage = ""

      if (!this.selectedposturalbloodpressure.patientrefused) {
        if (!this.selectedposturalbloodpressure.sbpsitting || !this.selectedposturalbloodpressure.sbpstanding || !this.selectedposturalbloodpressure.dbpsitting || !this.selectedposturalbloodpressure.dbpstanding) {
          this.editshowerror = true;
          this.editshowerrormessage = " Please Enter 	Systolic And Diastolic values."
          return
        }
        if (this.selectedposturalbloodpressure.sbpsitting < 50 || this.selectedposturalbloodpressure.sbpsitting > 300 || this.selectedposturalbloodpressure.sbpstanding < 50 ||  this.selectedposturalbloodpressure.sbpstanding > 300) {
          this.editshowerror = true;
          this.editshowerrormessage = "The allowed range for Systolic  is 50 to 300."
          return
        }
      }
      if (!this.patientrefuse) {
        if (this.selectedposturalbloodpressure.dbpsitting < 10 || this.selectedposturalbloodpressure.dbpsitting > 150 || this.selectedposturalbloodpressure.dbpstanding < 10 ||  this.selectedposturalbloodpressure.dbpstanding > 150) {
          this.editshowerror = true;
          this.editshowerrormessage = "The allowed range for Diastolic is 10 to 150."
          return
        }
      }
      

      if (!this.selectedposturalbloodpressure.patientrefused) {
        if ((this.selectedposturalbloodpressure.sbpsitting <= this.selectedposturalbloodpressure.dbpsitting)) {
          this.editshowerror = true;
          this.editsittingvalueError = true
          this.editshowerrormessage = "Diastolic cannot be equal to or greater than Systolic."
          return
        }
      }
      if (!this.selectedposturalbloodpressure.patientrefused) {
        if ((this.selectedposturalbloodpressure.sbpstanding <= this.selectedposturalbloodpressure.dbpstanding)) {
          this.editshowerror = true;
          this.editstandingvalueError = true
          this.editshowerrormessage = "Diastolic cannot be equal to or greater than Systolic."
          return
        }
      }

      if (this.selectedposturalbloodpressure.patientrefused && this.selectedposturalbloodpressure.reasonforpatientrefused.trim() == "") {
        this.editshowerror = true;
        this.editshowerrormessage = "Please enter reason for refusal."
        return
      }
      if (this.selectedposturalbloodpressure.resonforchange == "Other" && this.OthereReason.trim() == "") {
        this.editshowerror = true;
        this.editshowerrormessage = "Please enter Other reason."
        return
      }
    }
    else {
      let Record = this.posturalbloodpressureDetail.find(x => x.eventcorrelationid == this.selectedposturalbloodpressure.eventcorrelationid)
      Record.resonforchange = this.selectedposturalbloodpressure.resonforchange
      this.selectedposturalbloodpressure = JSON.parse(JSON.stringify(Record));
    }




    let eventcorrelationid = uuidv4();
    loggedInUser = this.appService.loggedInUserName

    var upsertManager = new UpsertTransactionManager();
    upsertManager.beginTran(this.appService.baseURI, this.apiRequest);

    let newObsEventSitting = JSON.parse(this.selectedposturalbloodpressure.__observationevent).find(x => x.observationevent_id == this.selectedposturalbloodpressure.obsevationeventsitting)
    newObsEventSitting.eventcorrelationid = eventcorrelationid


    let newObsEventStanding = JSON.parse(this.selectedposturalbloodpressure.__observationevent).find(x => x.observationevent_id == this.selectedposturalbloodpressure.obsevationeventstanding)
    newObsEventStanding.eventcorrelationid = eventcorrelationid

    newObsEventStanding.isamended = true;
    newObsEventSitting.isamended = true;
    if (this.selectedposturalbloodpressure.patientrefused) {
      newObsEventStanding.patientrefused = true;
      newObsEventSitting.patientrefused = true;
      newObsEventStanding.reasonforpatientrefused = this.selectedposturalbloodpressure.reasonforpatientrefused
      newObsEventSitting.reasonforpatientrefused = this.selectedposturalbloodpressure.reasonforpatientrefused
      this.selectedposturalbloodpressure.sbpsitting = this.selectedposturalbloodpressure.sbpstanding = this.selectedposturalbloodpressure.dbpsitting = this.selectedposturalbloodpressure.dbpstanding = null

    }


    Object.keys(newObsEventSitting).map((e) => { if (e.startsWith("_")) delete newObsEventSitting[e]; })
    Object.keys(newObsEventStanding).map((e) => { if (e.startsWith("_")) delete newObsEventStanding[e]; })

    if (action == "Delete") {
      newObsEventSitting.isdeleted = true;
      newObsEventSitting.deletedby = loggedInUser
      newObsEventSitting.reasonfordelete = this.selectedposturalbloodpressure.resonforchange
      newObsEventSitting.deletedreasonothertext = this.OthereReason;

      newObsEventStanding.isdeleted = true;
      newObsEventStanding.deletedby = loggedInUser
      newObsEventStanding.reasonfordelete = this.selectedposturalbloodpressure.resonforchange
      newObsEventStanding.deletedreasonothertext = this.OthereReason;
      if (this.selectedposturalbloodpressure.resonforchange == "Other") {
        newObsEventSitting.reasonforamendother = this.OthereReason;
        newObsEventStanding.reasonforamendother = this.OthereReason;
        this.selectedposturalbloodpressure.resonforchange = this.OthereReason;
      }
    }
    else {
      newObsEventSitting.reasonforamend = this.selectedposturalbloodpressure.resonforchange
      newObsEventStanding.reasonforamend = this.selectedposturalbloodpressure.resonforchange
      if (this.selectedposturalbloodpressure.resonforchange == "Other") {
        newObsEventSitting.reasonforamendother = this.OthereReason;
        newObsEventStanding.reasonforamendother = this.OthereReason;
        this.selectedposturalbloodpressure.resonforchange = this.OthereReason;
      }
    }
    if (!this.selectedposturalbloodpressure.patientrefused) {
      if (typeof this.selectedposturalbloodpressure.__obsevation === 'string') {
        this.selectedposturalbloodpressure.__obsevation = JSON.parse(this.selectedposturalbloodpressure.__obsevation)
      }


      // ---------------------------------------------------
      let Obssystolicsitting = this.selectedposturalbloodpressure.__obsevation.find(x => x.observationevent_id == this.selectedposturalbloodpressure.obsevationeventsitting &&
        x.observationtype_id == "af5dc4a2-3e40-4e09-9d4f-3ddb137158de")
      Obssystolicsitting.value = this.selectedposturalbloodpressure.sbpsitting
      Obssystolicsitting.eventcorrelationid = eventcorrelationid
      Object.keys(Obssystolicsitting).map((e) => { if (e.startsWith("_")) delete Obssystolicsitting[e]; })

      Obssystolicsitting._createdby = loggedInUser
      upsertManager.addEntity('core', 'observation', JSON.parse(JSON.stringify(Obssystolicsitting)));
      // ---------------------------------------------------
      let Obsdiastolicsitting = this.selectedposturalbloodpressure.__obsevation.find(x => x.observationevent_id == this.selectedposturalbloodpressure.obsevationeventsitting &&
        x.observationtype_id == "e2d6d5fa-2a38-448f-9e06-9a3e6b532bb5")
      Obsdiastolicsitting.value = this.selectedposturalbloodpressure.dbpsitting
      Obsdiastolicsitting.eventcorrelationid = eventcorrelationid
      Object.keys(Obsdiastolicsitting).map((e) => { if (e.startsWith("_")) delete Obsdiastolicsitting[e]; })
      Obsdiastolicsitting._createdby = loggedInUser
      upsertManager.addEntity('core', 'observation', JSON.parse(JSON.stringify(Obsdiastolicsitting)));
      // ---------------------------------------------------
      let Obssystolicstanding = this.selectedposturalbloodpressure.__obsevation.find(x => x.observationevent_id == this.selectedposturalbloodpressure.obsevationeventstanding &&
        x.observationtype_id == "af5dc4a2-3e40-4e09-9d4f-3ddb137158de");
      Obssystolicstanding.value = this.selectedposturalbloodpressure.sbpstanding
      Obssystolicstanding.eventcorrelationid = eventcorrelationid
      Object.keys(Obssystolicstanding).map((e) => { if (e.startsWith("_")) delete Obssystolicstanding[e]; })
      Obssystolicstanding._createdby = loggedInUser
      upsertManager.addEntity('core', 'observation', JSON.parse(JSON.stringify(Obssystolicstanding)));
      // ---------------------------------------------------
      let Obsdiastolicstanding = this.selectedposturalbloodpressure.__obsevation.find(x => x.observationevent_id == this.selectedposturalbloodpressure.obsevationeventstanding &&
        x.observationtype_id == "e2d6d5fa-2a38-448f-9e06-9a3e6b532bb5");
      Obsdiastolicstanding.value = this.selectedposturalbloodpressure.dbpstanding
      Obsdiastolicstanding.eventcorrelationid = eventcorrelationid
      Object.keys(Obsdiastolicstanding).map((e) => { if (e.startsWith("_")) delete Obsdiastolicstanding[e]; })
      Obsdiastolicstanding._createdby = loggedInUser
      upsertManager.addEntity('core', 'observation', JSON.parse(JSON.stringify(Obsdiastolicstanding)));

      let Obspositionstanding = this.selectedposturalbloodpressure.__obsevation.find(x => x.observationevent_id == this.selectedposturalbloodpressure.obsevationeventstanding &&
        x.observationtype_id == "d1ca3666-6b13-4c87-b4db-7141c0ead85e");
      Obspositionstanding.value = "Standing"
      Obspositionstanding.eventcorrelationid = eventcorrelationid
      Object.keys(Obspositionstanding).map((e) => { if (e.startsWith("_")) delete Obspositionstanding[e]; })
      Obsdiastolicstanding._createdby = loggedInUser
      upsertManager.addEntity('core', 'observation', JSON.parse(JSON.stringify(Obspositionstanding)));

      let Obspositionsitting = this.selectedposturalbloodpressure.__obsevation.find(x => x.observationevent_id == this.selectedposturalbloodpressure.obsevationeventstanding &&
        x.observationtype_id == "d1ca3666-6b13-4c87-b4db-7141c0ead85e");
      Obspositionsitting.value = "SittingOrLying"
      Obspositionsitting.eventcorrelationid = eventcorrelationid
      Object.keys(Obspositionsitting).map((e) => { if (e.startsWith("_")) delete Obspositionsitting[e]; })
      Obsdiastolicstanding._createdby = loggedInUser
      upsertManager.addEntity('core', 'observation', JSON.parse(JSON.stringify(Obspositionsitting)));
    }

    // ---------------------------------------------------
    Object.keys(this.selectedposturalbloodpressure).map((e) => { if (e.startsWith("_")) delete this.selectedposturalbloodpressure[e]; })
    this.selectedposturalbloodpressure.changevalue = Math.abs(this.selectedposturalbloodpressure.sbpsitting - this.selectedposturalbloodpressure.sbpstanding)
    this.selectedposturalbloodpressure.eventcorrelationid = eventcorrelationid
    this.selectedposturalbloodpressure.isamended = true;
    if (action == "Delete") {
      this.selectedposturalbloodpressure.isdeleted = true;
    }
    this.selectedposturalbloodpressure.modifiedon = this.getDateTime();
    upsertManager.addEntity('core', "posturalbloodpressure", JSON.parse(JSON.stringify(this.selectedposturalbloodpressure)));
    upsertManager.addEntity('core', "observationevent", JSON.parse(JSON.stringify(newObsEventSitting)));
    upsertManager.addEntity('core', "observationevent", JSON.parse(JSON.stringify(newObsEventStanding)));
    upsertManager.save((resp) => {
      console.log(resp)
      this.selectedposturalbloodpressure = null;
      this.showEdit = false;
      this.OthereReason = ""
      this.showDelete = false;
      this.subject.frameworkEvent.next("BADGEACTION_UPDATEBADGE_" + BadgeNames.BloodGlucose)
      this.init();
    },
      (error) => {

        console.log(error)

      }
    );

  }
  receivehistoryViewerData(data) {
    if (data.clickedAction == "showHistory") {
      let Record = this.posturalbloodpressureDetail.find(x => x.eventcorrelationid == data.eventcorrelationid)
      this.selectedposturalbloodpressure = JSON.parse(JSON.stringify(Record));
      this.RecordHistory = JSON.parse(this.selectedposturalbloodpressure.__posturalbloodpressure)
      for(let r of this.RecordHistory)(
        r.changevalue= Math.abs(r.changevalue)
      )
      this.RecordHistory.sort((a, b) => new Date(b._createddate).getTime() - new Date(a._createddate).getTime());
     
      this.showEditHistory = true;
    }
    else {
      let Record = this.posturalbloodpressureDetail.find(x => x.eventcorrelationid == data.eventcorrelationid)
      if (Record.patientrefused) {
        let events = JSON.parse(Record.__observationevent)
        console.log(events)
        let newObsEventSitting = JSON.parse(JSON.stringify(events.find(x => x.observationtype_id == "95229151-31e6-4996-955e-32dd43c0d281")));
        let newObsEventStanding = JSON.parse(JSON.stringify(events.find(x => x.observationtype_id == "0cf5654c-277f-4dec-b5de-c0c0e3488634")));
        Record.__obsevation = [];

        Record.__obsevation.push(this.createObsevation(newObsEventSitting, newObsEventSitting.eventcorrelationid, "af5dc4a2-3e40-4e09-9d4f-3ddb137158de", ""))
        Record.__obsevation.push(this.createObsevation(newObsEventSitting, newObsEventSitting.eventcorrelationid, "e2d6d5fa-2a38-448f-9e06-9a3e6b532bb5", ""))
        Record.__obsevation.push(this.createObsevation(newObsEventSitting, newObsEventSitting.eventcorrelationid, "d1ca3666-6b13-4c87-b4db-7141c0ead85e", "SittingOrLying"))



        Record.__obsevation.push(this.createObsevation(newObsEventStanding, newObsEventStanding.eventcorrelationid, "af5dc4a2-3e40-4e09-9d4f-3ddb137158de", ""))
        Record.__obsevation.push(this.createObsevation(newObsEventStanding, newObsEventStanding.eventcorrelationid, "e2d6d5fa-2a38-448f-9e06-9a3e6b532bb5", ""))
        Record.__obsevation.push(this.createObsevation(newObsEventStanding, newObsEventStanding.eventcorrelationid, "d1ca3666-6b13-4c87-b4db-7141c0ead85e", "Standing"));

      }


      this.selectedposturalbloodpressure = JSON.parse(JSON.stringify(Record));
      this.selectedposturalbloodpressure.resonforchange = "Entered in error";
      this.changevalueedit = Math.abs( this.selectedposturalbloodpressure.sbpsitting - this.selectedposturalbloodpressure.sbpstanding)

      this.editshowerror = false;
    this.editstandingvalueError = false
    this.editsittingvalueError = false
    this.editshowerrormessage = ""
      this.showEdit = true;
    }
  }
  ShowRecordHistory(Record: any) {
    this.selectedposturalbloodpressure = JSON.parse(JSON.stringify(Record));
    this.RecordHistory = JSON.parse(this.selectedposturalbloodpressure.__posturalbloodpressure)
    this.RecordHistory.sort((a, b) => new Date(b.modifiedon).getTime() - new Date(a.modifiedon).getTime());
    this.showEditHistory = true;
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

  ChoosenfilterdateChange(selectvalue: any) {

  }
  DeleteCancelClick() {
    if (this.selectedposturalbloodpressure.resonforchange == "Recorded for the wrong patient") {
      this.selectedposturalbloodpressure.resonforchange = "Entered in error"
    }
    this.showDelete = false;
    this.showEdit = true;
  }
  createFilter() {
    let condition = "personid = @personid and encounterid = @encounterid";
    // let condition = "personid = @personid";

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
    createFilterobservation() {
    let condition = "person_id = @personid and encounter_id = @encounterid";
    // let condition = "personid = @personid";

    let f = new filters()
    f.filters.push(new filter(condition));

    let pm = new filterParams();
    pm.filterparams.push(new filterparam("personid", this.appService.personId));
     pm.filterparams.push(new filterparam("encounterid", this.appService.encounter.encounter_id));

    let select = new selectstatement("SELECT *");

    let orderby = new orderbystatement("");

    let body = [];
    body.push(f);
    body.push(pm);
    body.push(select);
    body.push(orderby);

    return JSON.stringify(body);
  }

  closeBloodPressureModal() {
    this.subject.closeModal.next('close modal');
  }

  patientrefuseChange() {
    if (!this.patientrefuse) {
      this.showpatientrefuselink = true;
    }
  }

  showeModelditdiscardMethod(Method: string) {
    
    if (Method == 'edit') {
      this.editshowerror = false;
      let Record = this.posturalbloodpressureDetail.find(x => x.eventcorrelationid == this.selectedposturalbloodpressure.eventcorrelationid)
      if(this.selectedposturalbloodpressure.dbpsitting  == Record.dbpsitting && this.selectedposturalbloodpressure.dbpstanding  == Record.dbpstanding && this.selectedposturalbloodpressure.sbpsitting  == Record.sbpsitting  && this.selectedposturalbloodpressure.sbpstanding  == Record.sbpstanding  && this.selectedposturalbloodpressure.patientrefused  == Record.patientrefused && this.selectedposturalbloodpressure.reasonforpatientrefused  == Record.reasonforpatientrefused){
        this.showEdit =false
      }
      else{
        this.showeditdiscard =true
      }


    }
    else {
      if(this.systolicsitting >0 || this.systolicstanding > 0 || this.diastolicsitting >0 || this.diastolicstanding >0 || this.patientrefuse){
        this.showeModelditdiscard =true
      }
      else{
        this.subject.closeModal.next('close modal');
      }

    }

  }

}

