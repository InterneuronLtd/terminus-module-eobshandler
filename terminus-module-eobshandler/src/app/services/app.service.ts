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
import { Injectable } from '@angular/core';
import { Encounter } from '../models/encounter.model';
import { jwtDecode } from "jwt-decode";
import { action } from '../models/filter.model';
import * as moment from 'moment';
import { v4 as uuid } from 'uuid';
import { ApirequestService } from './apirequest.service';
import { filter, filterParams, filterparam, filters, orderbystatement, selectstatement } from '../models/filter.model';
import { Observationscaletype, PersonObservationScale } from '../models/person.model';
import { SubjectsService } from './subjects.service';


@Injectable({
  providedIn: 'root'
})
export class AppService {

  constructor(private subjects: SubjectsService) { }
  public modulename = "app-eobshandler";
  public enableLogging = true;
  public appConfig: any;
  public apiService: any;
  public baseURI: string;
  public roleActions: action[] = [];
  public personId: string;
  public dataversion = null;
  public loggedInUserName: string = null;
  public loggedInUserRoles: Array<string> = [];
  public encounter: Encounter;
  public isCurrentEncouner = false;
  public startTime: any;
  public obsScales: Array<Observationscaletype> = [];
  personscale: PersonObservationScale = null;
  public personAgeAtAdmission: number;
  public currentEWSScale: string;
  public personDOB: Date;
  public  PersonCurrentAge: number;
  public gender: string = '';

  reset(): void {
    this.apiService = null;
    this.appConfig = null;
    this.enableLogging = true;
    this.baseURI = null;
    this.roleActions = [];
    this.personId = null;
    this.dataversion = null;
    this.loggedInUserName = null;
    this.loggedInUserRoles = [];
    this.encounter = null;
    this.isCurrentEncouner = null;
    this.startTime = null;
    this.obsScales = [];
    this.personscale = null;
    this.personAgeAtAdmission = null;
    this.currentEWSScale = null;
    this.personDOB = null;
    this.PersonCurrentAge=null;
    this.gender=null;
  }

  decodeAccessToken(token: string): any {
    try {
      return jwtDecode(token);
    }
    catch (Error) {
      this.logToConsole(`Error: ${Error}`);
      return null;
    }
  }


  public AuthoriseAction(action: string): boolean {
    //return true;
    if (this.encounter.dischargedatetime != null) //patient is discharged
    {
      return false;
    }
    if (this.appConfig && this.appConfig.AppSettings.enableRBAC)
      return this.roleActions.filter(x => x.actionname.toLowerCase().trim() == action.toLowerCase()).length > 0;
    else
      return true;

  }

  createEncounterFilter() {

    let condition = "person_id=@person_id";
    let f = new filters()
    f.filters.push(new filter(condition));

    let pm = new filterParams();

    pm.filterparams.push(new filterparam("person_id", this.personId));

    let select = new selectstatement("SELECT person_id, encounter_id, admitdatetime, dischargedatetime, patientclasscode, episodestatuscode");

    let orderby = new orderbystatement("ORDER BY admitdatetime desc");

    let body = [];
    body.push(f);
    body.push(pm);
    body.push(select);
    body.push(orderby);

    return JSON.stringify(body);
  }

  public getDateTimeinISOFormat(date = new Date()): string {

    if (typeof date === 'string') {
      date = new Date(date);
    }

    var time = date;
    var hours = time.getHours();
    var s = time.getSeconds();
    var m = time.getMilliseconds()
    var minutes = time.getMinutes();
    date.setHours(hours);
    date.setMinutes(minutes);
    //date.setSeconds(s);
    //date.setMilliseconds(m);
    //this.appService.logToConsole(date);
    let year = date.getFullYear();
    let month = (date.getMonth() + 1);
    let dt = date.getDate();
    let hrs = date.getHours();
    let mins = date.getMinutes();
    let secs = date.getSeconds();
    let msecs = date.getMilliseconds();
    let returndate = (year + "-" + (month < 10 ? "0" + month : month) + "-" + (dt < 10 ? "0" + dt : dt) + "T" + (hrs < 10 ? "0" + hrs : hrs) + ":" + (mins < 10 ? "0" + mins : mins) + ":" + (secs < 10 ? "0" + secs : secs) + "." + (msecs < 10 ? "00" + msecs : (msecs < 100 ? "0" + msecs : msecs)));
    //this.appService.logToConsole(returndate);
    return returndate;
  }

  logToConsole(msg: any) {
    if (this.enableLogging) {
      console.log(msg);
    }
  }

  validationForMonitoringFrequencyNotAllowed7Days(enteredMonitoringFrequency, enteredMonitoringFrequencyUnit) {
    let convertMonitoingFrequencyMinToHours;
    let convertMonitoingFrequencyHoursToDays
    let checkHourGreaterThan7Days = false;

    if (enteredMonitoringFrequencyUnit == 'min' || enteredMonitoringFrequencyUnit == 'minutes') {
      convertMonitoingFrequencyMinToHours = Math.ceil(enteredMonitoringFrequency / 60);
      convertMonitoingFrequencyHoursToDays = Math.ceil(convertMonitoingFrequencyMinToHours / 24);
    }
    else if (enteredMonitoringFrequencyUnit == 'hours') {
      convertMonitoingFrequencyHoursToDays = Math.ceil(enteredMonitoringFrequency / 24);
    }
    else if (enteredMonitoringFrequencyUnit == 'days') {
      convertMonitoingFrequencyHoursToDays = enteredMonitoringFrequency;
    }

    if (convertMonitoingFrequencyHoursToDays > 7) {
      checkHourGreaterThan7Days = true
    }
    else {
      checkHourGreaterThan7Days = false;
    }

    return checkHourGreaterThan7Days;
  }

  setPatientAgeAtAdmission() {
    this.personAgeAtAdmission = moment(this.encounter.admitdatetime, moment.ISO_8601).diff(moment(this.personDOB, moment.ISO_8601), "years");
    this.PersonCurrentAge =  moment(new Date()).diff(moment(this.personDOB, moment.ISO_8601), "years");
  }

  setCurrentScale() {
    let scale = "";

    if (this.personscale) {
      const matchedScale = this.obsScales.find(x => x.observationscaletype_id === this.personscale.observationscaletype_id);
      scale = matchedScale?.scaletypename || "";

      if (this.personscale.encounter_id !== this.encounter.encounter_id && this.isCurrentEncouner) {
        scale = this.getScaleByAge(this.PersonCurrentAge);
      }
    } else {

      scale = this.getScaleByAge(this.PersonCurrentAge);
    }

    this.currentEWSScale = scale;

    this.subjects.frameworkEvent.next("BADGEACTION_EWSCHARTTYPE_" + this.GetChartType())

    return scale;
  }

  GetChartType()
  {
    switch (this.currentEWSScale) {
      case "NEWS2-Scale1":
      case "NEWS2-Scale2":
        {
          return "NEWS2";
        }
      case "PEWS-0To11Mo":
      case "PEWS-1To4Yrs":
      case "PEWS-5To12Yrs":
      case "PEWS-13To18Yrs":
        {
          return "PEWS";
        }
      case "MEWS-Scale": return "MEWS";
      case "MARSI": return "Marsi MEWS";
      default
      :
        return "";
    }
  } 
  
  private getScaleByAge(age: number): string {
    if (age < this.appConfig.appsettings.pewsAgeThreshold) {
      if (age <= 0) return "PEWS-0To11Mo";
      if (age >= 1 && age <= 4) return "PEWS-1To4Yrs";
      if (age >= 5 && age <= 12) return "PEWS-5To12Yrs";
      if (age >= 13 && age <= 18) return "PEWS-13To18Yrs";
    }
    return "NEWS2-Scale1";
  }

  saveScale(scale:any){  
    if(this.gender == "F" && this.appConfig.AutoSelectMEWSforWard !="" && this.appConfig.AutoSelectMEWSforWard == this.encounter.assignedpatientlocationpointofcare){
      scale = "MEWS-Scale"
    }


  let  scaleid = this.obsScales.filter(x => x.scaletypename == scale)[0].observationscaletype_id;

    let personobservationscale = new PersonObservationScale();
    if(this.personscale){
      personobservationscale.personobservationscale_id =this.personscale.personobservationscale_id
    }
    else{
      personobservationscale.personobservationscale_id = uuid();
    }
   
    personobservationscale.person_id = this.personId;
    personobservationscale.observationscaletype_id = scaleid;
    personobservationscale.createdby="System"
    personobservationscale.createdon= this.getDateTimeinISOFormat();
    personobservationscale.reason="";
    personobservationscale.encounter_id = this.encounter.encounter_id
    
    this.personscale = personobservationscale; 
     this.subjects.savePersonscale.next( this.personscale)
    
  }

  public isNewsScale(ewsScaleType: string) {
    switch (ewsScaleType) {
      case "NEWS2-Scale1":
      case "NEWS2-Scale2":
        {
          return true;
        }
      case "PEWS-0To11Mo":
      case "PEWS-1To4Yrs":
      case "PEWS-5To12Yrs":
      case "PEWS-13To18Yrs":
        {
          return false;
        }
      default:
        return null;
    }
  }


}

export enum BadgeNames {
  ["BristolStoolChart"] = "BristolStoolChart",
  ["GlasgowComaScale"] = "GlasgowComaScale",
  ["NEWS2Monitoring"] = "NEWS2Monitoring",
  ["FoodAndFluid"] = "FoodAndFluid",
  ["PosturalBloodPressure"] = "PosturalBloodPressure",
   ["heightWeightwaist"] = "Measurements",
  ["BloodGlucose"] = "BloodGlucose"
}


