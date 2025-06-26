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
import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { UntypedFormBuilder, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { ApirequestService } from '../services/apirequest.service';
import { AppService } from '../services/app.service';
import { filter, filterparam, filterParams, filters, orderbystatement, selectstatement } from '../models/filter.model';

@Component({
  selector: 'app-monitoring-frequency',
  templateUrl: './monitoring-frequency.component.html',
  styleUrls: ['./monitoring-frequency.component.css']
})
export class MonitoringFrequencyComponent implements OnInit, OnDestroy {

  obsmonitoringfrequencyform = this.fb.group({
    monitoringFrequency: [''],
    frequency_entered: [''],
    frequencyunit_entered: [''],
    frequency_reason: [''],
    frequency_reason_other: [''],
  });

  ewsScoreHeader: string = "";
  response: any = { score: 0, clinicalresponse: "", monitoring: "", cssclass: "", text: "", topConcernsText: "", scoreTypeHeading: "" };
  other_concerns_about_patient_warning_message: string;
  could_be_infection_warning_message: string;
  subscriptions: Subscription = new Subscription();
  calculatedMonitoringFrequency: any;
  defaultMonitoringFrequencyValue: any;
  defaultMonitoringFrequencyUnit: any;
  showFrequencyReason: boolean = true;
  isnews2suggestestedfreq: boolean = false;
  observationtypetext: any;
  isNewsScale: boolean;
  selectedobservationtype: string;
  validationHours: number = 0;
  readOnly: boolean;
  latestNEWS2Score: any;
  validationMaxHours: number = 0;
  isDefaultMonitoringFrequencySet: boolean = false;
  days = [{'id':'1','value':'1'},{'id':'2','value':'2'},{'id':'3','value':'3'},{'id':'4','value':'4'},{'id':'5','value':'5'},{'id':'6','value':'6'},{'id':'7','value':'7'}];
  hours = [{'id':'1','value':'1'},{'id':'2','value':'2'},{'id':'4','value':'4'},{'id':'6','value':'6'},{'id':'8','value':'8'},{'id':'12','value':'12'},{'id':'24','value':'24'}];
  minutes = [{'id':'5','value':'5'},{'id':'10','value':'10'},{'id':'15','value':'15'},{'id':'30','value':'30'},{'id':'60','value':'60'}];

  @Input() set observationtype (value: any) {
    // console.log('value',value.observationtype);
    if(value.RBAC) {
      this.obsmonitoringfrequencyform.get('frequency_entered')?.enable();
      this.obsmonitoringfrequencyform.get('frequencyunit_entered')?.enable();
      this.obsmonitoringfrequencyform.get('monitoringFrequency')?.enable();
      this.obsmonitoringfrequencyform.get('frequency_reason')?.enable();
    }
    else {
      this.obsmonitoringfrequencyform.get('frequency_entered')?.disable();
      this.obsmonitoringfrequencyform.get('frequencyunit_entered')?.disable();
      this.obsmonitoringfrequencyform.get('monitoringFrequency')?.disable();
      if(value.observationtype == 'news2frequency' || value.observationtype == 'pewsfrequency' || value.observationtype == 'mewsfrequency' || value.observationtype == 'marsifrequency') {
        this.obsmonitoringfrequencyform.get('frequency_reason')?.disable();
      }
      else {
        this.obsmonitoringfrequencyform.get('frequency_reason')?.disable();
        this.obsmonitoringfrequencyform.get('frequency_reason_other')?.disable();
      }
      
    }

    this.selectedobservationtype = value.observationtype;

      this.subscriptions.add(this.apiRequest.getRequest(`${this.appService.baseURI}/GetList?synapsenamespace=meta&synapseentityname=observationtype`)
      .subscribe(
        (response) => {
          if (response) {
            let responseArray = JSON.parse(response);
        
            this.observationtypetext = responseArray.find(x => x.name == value.observationtype);
            this.calculateMonitoringFrequency();
            this.sendMonitoringFrequencyData();
          }
        }
      ));
  }

  @Input() set defaultMonitoringFrequencyData (value: any) {
    console.log('defaultMonitoringFrequencyData',value);
    if(value) {
      
      this.readOnly = value.readOnly?? false;
      if(value.ispause) {
        this.obsmonitoringfrequencyform.get('frequency_entered').setValue(null);
        this.obsmonitoringfrequencyform.get('frequency_entered').updateValueAndValidity();

        this.obsmonitoringfrequencyform.get('frequencyunit_entered').setValue(null);
        this.obsmonitoringfrequencyform.get('frequencyunit_entered').updateValueAndValidity();

        this.obsmonitoringfrequencyform.get('monitoringFrequency').setValue('pause');
        this.obsmonitoringfrequencyform.get('monitoringFrequency').updateValueAndValidity();
      }
      else if(value.isstop && this.selectedobservationtype != 'news2frequency' && this.selectedobservationtype != 'pewsfrequency' && this.selectedobservationtype != 'mewsfrequency' && this.selectedobservationtype != 'marsifrequency') {
        this.obsmonitoringfrequencyform.get('frequency_entered').setValue(null);
        this.obsmonitoringfrequencyform.get('frequency_entered').updateValueAndValidity();

        this.obsmonitoringfrequencyform.get('frequencyunit_entered').setValue(null);
        this.obsmonitoringfrequencyform.get('frequencyunit_entered').updateValueAndValidity();

        this.obsmonitoringfrequencyform.get('monitoringFrequency').setValue('stop');
        this.obsmonitoringfrequencyform.get('monitoringFrequency').updateValueAndValidity();
      }
      else if(value.monitoringnotrequired) {
        this.obsmonitoringfrequencyform.get('frequency_entered').setValue(null);
        this.obsmonitoringfrequencyform.get('frequency_entered').updateValueAndValidity();

        this.obsmonitoringfrequencyform.get('frequencyunit_entered').setValue(null);
        this.obsmonitoringfrequencyform.get('frequencyunit_entered').updateValueAndValidity();

        this.obsmonitoringfrequencyform.get('monitoringFrequency').setValue('monitoringnotrequired');
        this.obsmonitoringfrequencyform.get('monitoringFrequency').updateValueAndValidity();
      }
      else {
        this.obsmonitoringfrequencyform.get('frequency_entered').setValue(value.frequency_entered);
        this.obsmonitoringfrequencyform.get('frequency_entered').updateValueAndValidity();

        this.obsmonitoringfrequencyform.get('frequencyunit_entered').setValue(value.frequencyunit_entered);
        this.obsmonitoringfrequencyform.get('frequencyunit_entered').updateValueAndValidity();

        this.obsmonitoringfrequencyform.get('monitoringFrequency').setValue('customMonitoringFrequency');
        this.obsmonitoringfrequencyform.get('monitoringFrequency').updateValueAndValidity();
      }
      
      if(value.frequency_reason) {
        this.obsmonitoringfrequencyform.get('frequency_reason').setValue(value.frequency_reason);
        this.obsmonitoringfrequencyform.get('frequency_reason').updateValueAndValidity();
      }
      else {
        this.obsmonitoringfrequencyform.get('frequency_reason').setValue('null');
        this.obsmonitoringfrequencyform.get('frequency_reason').updateValueAndValidity();
      }

      if(value.frequency_reason_other) {
        this.obsmonitoringfrequencyform.get('frequency_reason_other').setValue(value.frequency_reason_other);
        this.obsmonitoringfrequencyform.get('frequency_reason_other').updateValueAndValidity();
      }
      else {
        this.obsmonitoringfrequencyform.get('frequency_reason_other').setValue('');
        this.obsmonitoringfrequencyform.get('frequency_reason_other').updateValueAndValidity();
      }

      // if(value.readOnly) {
      //   this.obsmonitoringfrequencyform.get('frequency_entered')?.disable();
      //   this.obsmonitoringfrequencyform.get('frequencyunit_entered')?.disable();
      // }
      // else {
      //   if(this.observationtype.RBAC){
      //   this.obsmonitoringfrequencyform.get('frequency_entered')?.enable();
      //   this.obsmonitoringfrequencyform.get('frequencyunit_entered')?.enable();
      //   }
     // }

      // if(value.validationMaxHours && value.validationMaxHours != 0) {
      //   this.validationHours = value.validationMaxHours;
      //   // this.obsmonitoringfrequencyform.get('frequency_entered').setValidators([Validators.max(value.validationMaxHours)]);
      //   // this.obsmonitoringfrequencyform.get('frequency_entered').updateValueAndValidity();
      //   this.obsmonitoringfrequencyform.get('frequency_entered')?.disable();
      //   this.obsmonitoringfrequencyform.get('frequencyunit_entered')?.disable();
      // }
      // else {
      //   this.obsmonitoringfrequencyform.get('frequency_entered')?.enable();
      //   this.obsmonitoringfrequencyform.get('frequencyunit_entered')?.enable();
      // }

      this.calculateMonitoringFrequency();
      this.sendMonitoringFrequencyData();
    }
  }

  @Output() monitoringFrequencyOutput = new EventEmitter();

  constructor(private fb: UntypedFormBuilder, private apiRequest: ApirequestService,public appService:AppService) { }

  ngOnInit(): void {
    // if(this.observationtypetext && this.observationtypetext.name == 'news2frequency') {
      this.getLatestScore();
    // }
  }

  public calculateMonitoringFrequency() {
    
  //  if((this.appService.appConfig.ObservationMonitoringFrequency.defaultMonitoringFrequencyValue != this.obsmonitoringfrequencyform.getRawValue()["frequency_entered"]) || (this.appService.appConfig.ObservationMonitoringFrequency.defaultMonitoringFrequencyUnit != this.obsmonitoringfrequencyform.getRawValue()["frequencyunit_entered"])) {
      this.showFrequencyReason = false;
      this.isnews2suggestestedfreq = true;
    // }
    // else {
    //   this.showFrequencyReason = true;
    //   this.isnews2suggestestedfreq = true;
    // }

    let frequencyForMinute;
    let frequency_entered = this.obsmonitoringfrequencyform.getRawValue()["frequency_entered"];
    let frequencyunit_entered = this.selectedobservationtype == 'heightWeightWaist' ? 'days' : this.obsmonitoringfrequencyform.getRawValue()["frequencyunit_entered"];
    // if (this.observationtypetext) {
      this.checkValuesForMonitoringFrequencyEnteredExists(frequencyunit_entered,frequency_entered);
    // }
    
    if(frequencyunit_entered == 'min') {
      frequencyForMinute = (frequency_entered / 60).toFixed(2).toString();
      this.calculatedMonitoringFrequency = parseFloat(frequencyForMinute);
    }
    else if(frequencyunit_entered == 'hours') {
      this.calculatedMonitoringFrequency = frequency_entered;
    }
    else if(frequencyunit_entered == 'days') {
      this.calculatedMonitoringFrequency = (frequency_entered * 24);
    }
    else if(frequencyunit_entered == 'weeks') {
      this.calculatedMonitoringFrequency = (frequency_entered * 168);
    }

    if(this.obsmonitoringfrequencyform.getRawValue()["frequency_reason"] != 'NEWS2 protocol' && this.obsmonitoringfrequencyform.getRawValue()["frequency_reason"] != 'PEWS protocol' && this.obsmonitoringfrequencyform.getRawValue()["frequency_reason"] != 'MEWS protocol' && this.obsmonitoringfrequencyform.getRawValue()["frequency_reason"] != 'Marsi MEWS protocol') {
      this.sendMonitoringFrequencyData();
    }
    
  }

  monitoringFrequencyValueChanged() {

    this.obsmonitoringfrequencyform.get('frequency_reason').setValue('null');
    this.obsmonitoringfrequencyform.get('frequency_reason').updateValueAndValidity();

    // if(this.obsmonitoringfrequencyform.get('frequency_reason').value == "Other"){
      this.obsmonitoringfrequencyform.get('frequency_reason_other').setValue('');
      this.obsmonitoringfrequencyform.get('frequency_reason_other').updateValueAndValidity();
    // }
   
    this.sendMonitoringFrequencyData();
  }

  checkValuesForMonitoringFrequencyEnteredExists(frequencyUnit, frequencyValue) {
    let monitoringFrequency;
    if(frequencyUnit == 'hours') {
      let checkHours = this.hours.find(x => x.value == frequencyValue);
      if (checkHours) {
        monitoringFrequency = frequencyValue
      }
      else {
        monitoringFrequency = 'null'
      }
    }
    else if (frequencyUnit == 'days') {
      let checkDays = this.days.find(x => x.value == frequencyValue);
      if (checkDays) {
        monitoringFrequency = frequencyValue
      }
      else {
        if(this.selectedobservationtype == 'heightWeightWaist') {
          monitoringFrequency = frequencyValue
        }
        else {
          monitoringFrequency = 'null'
        }
        
      }
    }
    else if (frequencyUnit == 'min') {
      let checkMinutes = this.minutes.find(x => x.value == frequencyValue);
      if (checkMinutes) {
        monitoringFrequency = frequencyValue
      }
      else {
        monitoringFrequency = 'null'
      }
    }
    else {
      monitoringFrequency = 'null'
    }

    this.obsmonitoringfrequencyform.get('frequency_entered').setValue(monitoringFrequency);
    this.obsmonitoringfrequencyform.get('frequency_entered').updateValueAndValidity();
  }

  sendMonitoringFrequencyData() {
  
    if(this.observationtypetext && (this.observationtypetext.name == 'news2frequency' || this.observationtypetext.name == 'pewsfrequency' || this.observationtypetext.name == 'mewsfrequency' || this.observationtypetext.name == 'marsifrequency')) {
      if(this.obsmonitoringfrequencyform.getRawValue()["frequency_reason"] == 'NEWS2 protocol' || this.obsmonitoringfrequencyform.getRawValue()["frequency_reason"] == 'PEWS protocol' || this.obsmonitoringfrequencyform.getRawValue()["frequency_reason"] == 'MEWS protocol' || this.obsmonitoringfrequencyform.getRawValue()["frequency_reason"] == 'Marsi MEWS protocol') {
        if(this.latestNEWS2Score && (this.latestNEWS2Score.score || this.latestNEWS2Score.score == 0)) {
          let freqFromScore = this.getFrequencyFromNEWS2Score(this.latestNEWS2Score);
          this.obsmonitoringfrequencyform.get('frequency_entered').setValue(freqFromScore.suggestedMonitoringFrequencyValue);
          this.obsmonitoringfrequencyform.get('frequency_entered').updateValueAndValidity();
  
          this.obsmonitoringfrequencyform.get('frequencyunit_entered').setValue(freqFromScore.suggestedMonitoringFrequencyUnit);
          this.obsmonitoringfrequencyform.get('frequencyunit_entered').updateValueAndValidity();

          this.calculateMonitoringFrequency();
        }
        else {
          if(this.observationtypetext.name == 'pewsfrequency') {
            this.obsmonitoringfrequencyform.get('frequency_entered').setValue(this.appService.appConfig.ObservationMonitoringFrequency.defaultMonitoringPEWSFrequencyValue);
            this.obsmonitoringfrequencyform.get('frequency_entered').updateValueAndValidity();
    
            this.obsmonitoringfrequencyform.get('frequencyunit_entered').setValue(this.appService.appConfig.ObservationMonitoringFrequency.defaultMonitoringPEWSFrequencyUnit);
            this.obsmonitoringfrequencyform.get('frequencyunit_entered').updateValueAndValidity();
          }
          else if(this.observationtypetext.name == 'mewsfrequency') {
            this.obsmonitoringfrequencyform.get('frequency_entered').setValue(this.appService.appConfig.ObservationMonitoringFrequency.defaultMonitoringMEWSFrequencyValue);
            this.obsmonitoringfrequencyform.get('frequency_entered').updateValueAndValidity();
    
            this.obsmonitoringfrequencyform.get('frequencyunit_entered').setValue(this.appService.appConfig.ObservationMonitoringFrequency.defaultMonitoringMEWSFrequencyUnit);
            this.obsmonitoringfrequencyform.get('frequencyunit_entered').updateValueAndValidity();
          }
          else if(this.observationtypetext.name == 'marsifrequency') {
            this.obsmonitoringfrequencyform.get('frequency_entered').setValue(this.appService.appConfig.ObservationMonitoringFrequency.defaultMonitoringMARSIFrequencyValue);
            this.obsmonitoringfrequencyform.get('frequency_entered').updateValueAndValidity();
    
            this.obsmonitoringfrequencyform.get('frequencyunit_entered').setValue(this.appService.appConfig.ObservationMonitoringFrequency.defaultMonitoringMARSIFrequencyUnit);
            this.obsmonitoringfrequencyform.get('frequencyunit_entered').updateValueAndValidity();
          }
          else {
            this.obsmonitoringfrequencyform.get('frequency_entered').setValue(this.appService.appConfig.ObservationMonitoringFrequency.defaultMonitoringFrequencyValue);
            this.obsmonitoringfrequencyform.get('frequency_entered').updateValueAndValidity();
    
            this.obsmonitoringfrequencyform.get('frequencyunit_entered').setValue(this.appService.appConfig.ObservationMonitoringFrequency.defaultMonitoringFrequencyUnit);
            this.obsmonitoringfrequencyform.get('frequencyunit_entered').updateValueAndValidity();
          }
          

          this.calculateMonitoringFrequency();
        }
        
  
        this.obsmonitoringfrequencyform.get('frequency_entered')?.disable();
        this.obsmonitoringfrequencyform.get('frequencyunit_entered')?.disable();
      }
      else {
        this.obsmonitoringfrequencyform.get('frequency_entered')?.enable();
        this.obsmonitoringfrequencyform.get('frequencyunit_entered')?.enable();
      }
    }
    

    if(!this.obsmonitoringfrequencyform.invalid) {
      let monitoringFrequency = this.obsmonitoringfrequencyform.getRawValue()["monitoringFrequency"];
      let ispause = (monitoringFrequency != null && monitoringFrequency == 'pause') ? true :  false;
      let isstop = (monitoringFrequency != null && monitoringFrequency == 'stop') ? true :  false;
      let monitoringnotrequired = (monitoringFrequency != null && monitoringFrequency == 'monitoringnotrequired') ? true :  false;
      let monitoringFrequencyData = {
        frequency_entered: isstop? 'null':this.obsmonitoringfrequencyform.getRawValue()["frequency_entered"],
        frequencyunit_entered: isstop? 'null':this.obsmonitoringfrequencyform.getRawValue()["frequencyunit_entered"],
        frequency_reason: this.obsmonitoringfrequencyform.getRawValue()["frequency_reason"],
        frequency_reason_other: this.obsmonitoringfrequencyform.getRawValue()["frequency_reason"] == 'Other' ? this.obsmonitoringfrequencyform.getRawValue()["frequency_reason_other"] : null,
        ispause: ispause,
        isstop: isstop,
        isnews2suggestestedfreq: this.isnews2suggestestedfreq,
        monitoringFrequency: isstop?null:Number(this.calculatedMonitoringFrequency),
        observationtype_id: (this.observationtypetext ? this.observationtypetext.observationtype_id : ''),
        observationtypetext: (this.observationtypetext ? this.observationtypetext.name : ''),
        monitoringnotrequired: monitoringnotrequired,
        NEWS2Score: this.latestNEWS2Score ? this.latestNEWS2Score : ''
      }
      if(this.observationtypetext && this.observationtypetext.name != 'news2frequency' && this.observationtypetext.name != 'pewsfrequency' && this.observationtypetext.name != 'mewsfrequency' && this.observationtypetext.name != 'marsifrequency') { 
        delete monitoringFrequencyData.NEWS2Score;
      }
      this.monitoringFrequencyOutput.emit(monitoringFrequencyData);
    }
    
  }

  getLatestScore() {
    this.subscriptions.add(this.apiRequest.postRequest(`${this.appService.baseURI}/GetBaseViewListByPost/eobs_getlatestmonitoringfrequencynews2`, this.createFilterScore())
      .subscribe((response) => {
        if (response) {
          let responseEvent = response;
          this.isDefaultMonitoringFrequencySet = true;
          if (responseEvent && responseEvent.length > 0) {
            this.latestNEWS2Score = responseEvent[0];
            
          }
        }
      }));
  }

  createFilterScore() {
    //let condition = "person_id = @person_id and encounter_id = @encounter_id";
    let condition = "encounter_id = @encounter_id";

    let f = new filters()
    f.filters.push(new filter(condition));

    let pm = new filterParams();
    pm.filterparams.push(new filterparam("encounter_id", this.appService.encounter.encounter_id));
    // pm.filterparams.push(new filterparam("encounter_id", this.appService.encounter.encounter_id));

    let select = new selectstatement("SELECT *");

    let orderby = new orderbystatement("ORDER BY 1");

    let body = [];
    body.push(f);
    body.push(pm);
    body.push(select);
    body.push(orderby);

    return JSON.stringify(body);
  }

  getFrequencyFromNEWS2Score(data) {
    let suggestedMonitoringFrequencyData;
    let suggestedMonitoringFrequencyValue;
    let suggestedMonitoringFrequencyUnit;
    if(this.observationtypetext.name == 'pewsfrequency') {
      if(data.guidance.split(" ")[0] == "ZERO") {
        suggestedMonitoringFrequencyValue = '12';
        suggestedMonitoringFrequencyUnit = 'hours';
      }
      else if(data.guidance.split(" ")[0] == "LOW") {
        suggestedMonitoringFrequencyValue = '1';
        suggestedMonitoringFrequencyUnit = 'hours';
      }
      else if(data.guidance.split(" ")[0] == "MEDIUM") {
        suggestedMonitoringFrequencyValue = '30';
        suggestedMonitoringFrequencyUnit = 'min';
      }
      else if(data.guidance.split(" ")[0] == "HIGH") {
        suggestedMonitoringFrequencyValue = '5';
        suggestedMonitoringFrequencyUnit = 'min';
      }
      else if(data.guidance.split(" ")[0] == "EMERGENCY") {
        suggestedMonitoringFrequencyValue = '5';
        suggestedMonitoringFrequencyUnit = 'min';
      }
      // else {
      //   suggestedMonitoringFrequencyValue = this.appService.appConfig.appsettings.SBAR.defaultPEWSMonitoringFrequency;
      //   suggestedMonitoringFrequencyUnit = this.appService.appConfig.appsettings.SBAR.defaultPEWSMonitoringFrequencyUnit;
      // }
    }
    else if(this.observationtypetext.name == 'mewsfrequency') {
      if(data.guidance.split(" ")[0] == "LOW") {
        suggestedMonitoringFrequencyValue = '12';
        suggestedMonitoringFrequencyUnit = 'hours';
      }
      else if(data.guidance.split(" ")[0] == "LOW-MEDIUM") {
        suggestedMonitoringFrequencyValue = '4';
        suggestedMonitoringFrequencyUnit = 'hours';
      }
      else if(data.guidance.split(" ")[0] == "MEDIUM") {
        suggestedMonitoringFrequencyValue = '15';
        suggestedMonitoringFrequencyUnit = 'min';
      }
      else if(data.guidance.split(" ")[0] == "HIGH") {
        suggestedMonitoringFrequencyValue = '5';
        suggestedMonitoringFrequencyUnit = 'min';
      }
      // else {
      //   suggestedMonitoringFrequencyValue = this.appService.appConfig.appsettings.SBAR.defaultMEWSMonitoringFrequency;
      //   suggestedMonitoringFrequencyUnit = this.appService.appConfig.appsettings.SBAR.defaultMEWSMonitoringFrequencyUnit;
      // }
    }
     else if(this.observationtypetext.name == 'marsifrequency') {
      if(data.guidance.split(" ")[0] == "NO") {
        suggestedMonitoringFrequencyValue = '6';
        suggestedMonitoringFrequencyUnit = 'hours';
      }
      else if(data.guidance.split(" ")[0] == "LOW") {
        suggestedMonitoringFrequencyValue = '4';
        suggestedMonitoringFrequencyUnit = 'hours';
      }
      else if(data.guidance.split(" ")[0] == "MEDIUM") {
        suggestedMonitoringFrequencyValue = '1';
        suggestedMonitoringFrequencyUnit = 'hours';
      }
      else if(data.guidance.split(" ")[0] == "MEDIUM-HIGH") {
        suggestedMonitoringFrequencyValue = '30';
        suggestedMonitoringFrequencyUnit = 'min';
      }
      else if(data.guidance.split(" ")[0] == "HIGH") {
        suggestedMonitoringFrequencyValue = '15';
        suggestedMonitoringFrequencyUnit = 'min';
      }
      // else {
      //   suggestedMonitoringFrequencyValue = this.appService.appConfig.appsettings.SBAR.defaultMARSIMonitoringFrequency;
      //   suggestedMonitoringFrequencyUnit = this.appService.appConfig.appsettings.SBAR.defaultMARSIMonitoringFrequencyUnit;
      // }
    }
    else {
      if (data.guidance.split(" ")[0] == "LOW/MEDIUM") {
        suggestedMonitoringFrequencyValue = '1';
        suggestedMonitoringFrequencyUnit = 'hours';
      }
      else if (this.latestNEWS2Score.score == '0') {
        suggestedMonitoringFrequencyValue = '12';
        suggestedMonitoringFrequencyUnit = 'hours';
      }
      else if (this.latestNEWS2Score.score >= '1' && this.latestNEWS2Score.score <= '4') {
        suggestedMonitoringFrequencyValue = '4';
        suggestedMonitoringFrequencyUnit = 'hours';
      }
      else if (this.latestNEWS2Score.score >= '5' && this.latestNEWS2Score.score <= '6') {
        suggestedMonitoringFrequencyValue = '1';
        suggestedMonitoringFrequencyUnit = 'hours';
      }
      else if (this.latestNEWS2Score.score >= '7') {
        suggestedMonitoringFrequencyValue = '5';
        suggestedMonitoringFrequencyUnit = 'min';
      }
    }
    

    return suggestedMonitoringFrequencyData = {
      'suggestedMonitoringFrequencyValue': suggestedMonitoringFrequencyValue,
      'suggestedMonitoringFrequencyUnit': suggestedMonitoringFrequencyUnit
    }
  }

  getNumbers() {
    return Array.from({ length: 30 }, (_, i) => i + 1);
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

}
