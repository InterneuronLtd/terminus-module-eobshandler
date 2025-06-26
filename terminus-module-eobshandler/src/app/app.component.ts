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
import { Component, EventEmitter, Input, OnDestroy, Output } from '@angular/core';
import { action, DataContract, filter, filterparam, filterParams, filters, orderbystatement, selectstatement } from './models/filter.model';
import { Subscription } from 'rxjs';
import { AppService, BadgeNames } from './services/app.service';
import { ApirequestService } from './services/apirequest.service';
import { SubjectsService } from './services/subjects.service';
import { environment } from 'src/environments/environment';
import { SharedDataContainerService } from './services/shared-data-container.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnDestroy {
  title = 'terminus-module-eobshandler';
  moduleContext = null;
  initComplete: boolean = false;
  reasonModalValue: string;
  showReason: boolean = false;
  @Input() set datacontract(value: DataContract) {
    this.appService.personId = value.personId;
    this.appService.apiService = value.apiService;
    let encounter = value.additionalInfo.find(x => x.key == "encounter");
    if (encounter)
      this.appService.encounter = encounter.value;
    let requestedHandler = value.additionalInfo.find(x => x.key == "requestedHandler");
    if (requestedHandler)
      this.moduleContext = requestedHandler.value;
    this.subjects.unload = value.unload;
    this.initConfigAndGetMeta(this.appService.apiService);

  }

  @Output() frameworkAction = new EventEmitter<string>();

  subscriptions: Subscription = new Subscription();

  BadgeNames = BadgeNames;
  EmitFrameworkEvent(e: string) {
    this.frameworkAction.emit(e);
  }

  constructor(private subjects: SubjectsService, public appService: AppService, private apiRequest: ApirequestService, public sharedDataContainerService: SharedDataContainerService) {

    this.subjects.showReasonModal.subscribe(value => {
      this.showReason = true;
      this.reasonModalValue = value;

    })

    this.subjects.closeModal.subscribe(value => {
      this.moduleContext = null;
      this.subjects.unload.next("app-eobshandler");

    })

    this.subjects.frameworkEvent.subscribe((value: string) => {
      this.EmitFrameworkEvent(value);
      if (value && value.indexOf("BADGEACTION") != -1) {
        this.EmitFrameworkEvent("REFRESH_LIST")
      }
    })

    if (!environment.production)
      this.initDevMode();
  }

  initDevMode() {
    //commment out to push to framework - 3lines  
    this.appService.personId = "97105af9-29fd-4e5e-a24b-a9796c9e0bee"// "441b520a-56e8-4c32-9eed-8c0c2e4b6377"//"fdd3c592-51f1-4aca-8acc-16ee966bebb8" //"68dfe39d-4ee4-407f-824b-4b57a1f131ae"  //"862fc611-a0a4-43f2-8dc4-4134fb7129ad"//"5bd254ac-5eb9-4a58-9b75-b3312d779fcc"//"e7955e6f-3384-4065-a425-0717018a9d2b"//"bef282e7-f182-4ad7-a221-f5f3c61e7919"//"68dfe39d-4ee4-407f-824b-4b57a1f131ae"  //"41f23bf6-8c4d-4aab-b0bd-a0871b324b5f"// "b0d70586-3206-4bd2-93f8-86a9947a8659"  //"c8c654c5-9272-4324-b3f0-2cf8be9a9576" //"e71e474c-7740-45ed-be41-78705f4b16bb";//"bef282e7-f182-4ad7-a221-f5f3c61e7919"//"3abf8a1b-1f94-407e-a37b-9d7481a3bd2a"// "ef45c1b8-d4cd-4c2f-afbc-fd9dda1b83ab";// "925d2652-0250-4b34-954e-7c53c7ceb5c6" //"a5092198-0843-4336-89a1-c288fbca9528"// "b2ec9a03-885a-4125-8c4c-220c78c9234d" //"40a6ed41-349d-4225-8058-ec16c4d6af00"; // "c6e089d5-21b3-4bdb-ba39-80ed6173db4a"; // '774c605e-c2c6-478d-90e6-0c1230b3b223'// "40a6ed41-349d-4225-8058-ec16c4d6af00" // "c6e089d5-21b3-4bdb-ba39-80ed6173db4a"//  "774c605e-c2c6-478d-90e6-0c1230b3b223"//"96ebefbe-a2e0-4e76-8802-e577e28fcc23";// "fe8a22fa-203d-4563-abe3-8818f37945d9";// "96ebefbe-a2e0-4e76-8802-e577e28fcc23" // //"774c605e-c2c6-478d-90e6-0c1230b3b223";//"4d05aff8-123f-4ca9-be06-f9734905c02f"//"d91ef1fa-e9c0-45ba-9e92-1e1c4fd468a2"// "027c3400-24cd-45c1-9e3d-0f4475336394" ;//  "6b187a8b-1835-42c2-9cd5-91aa0e39f0f7";//"6b187a8b-1835-42c2-9cd5-91aa0e39f0f7"//"774c605e-c2c6-478d-90e6-0c1230b3b223";//"0422d1d0-a9d2-426a-b0b2-d21441e2f045";//"6b187a8b-1835-42c2-9cd5-91aa0e39f0f7"; //"17775da9-8e71-4a3f-9042-4cdcbf97efec";// "429904ca-19c1-4a3a-b453-617c7db513a3";//"027c3400-24cd-45c1-9e3d-0f4475336394";//"429904ca-19c1-4a3a-b453-617c7db513a3";
    let value: any = {};
    value.authService = {};
    value.authService.user = {};
    let auth = this.apiRequest.authService;
    auth.getToken().then((token) => {
      value.authService.user.access_token = token;
      this.initConfigAndGetMeta(value);
    });




  }

  initConfigAndGetMeta(value: any) {
    this.appService.apiService = value;
    this.subscriptions.add(this.apiRequest.getRequest("./assets/config/eobshandlerConfig.json?V" + Math.random()).subscribe(
      (response) => {
        this.appService.appConfig = response;
        this.appService.baseURI = this.appService.appConfig.uris.baseuri;
        this.appService.enableLogging = this.appService.appConfig.enablelogging;

        //getPersonDateOfBirth
        this.subscriptions.add(this.apiRequest.getRequest(`${this.appService.baseURI}/GetObject?synapsenamespace=core&synapseentityname=person&id=${this.appService.personId}`).subscribe(
        (person) => {
          person = JSON.parse(person);
          if (person && person.dateofbirth) {
            this.appService.personDOB = <Date>person.dateofbirth;
          }

          //emit events after getting initial config. //this happens on first load only. 
          this.appService.logToConsole("Service reference is being published from init config");
          this.subjects.apiServiceReferenceChange.next(true);
          this.appService.logToConsole("personid is being published from init config");
          this.subjects.personIdChange.next(true);

        }));
        this.GetMetaData();

      }));
  }
  createEncounterFilter() {

    let condition = "person_id=@person_id";
    let f = new filters()
    f.filters.push(new filter(condition));

    let pm = new filterParams();

    pm.filterparams.push(new filterparam("person_id", this.appService.personId));

    let select = new selectstatement("SELECT person_id, encounter_id, admitdatetime, dischargedatetime, patientclasscode, episodestatuscode");

    let orderby = new orderbystatement("ORDER BY admitdatetime desc");

    let body = [];
    body.push(f);
    body.push(pm);
    body.push(select);
    body.push(orderby);

    return JSON.stringify(body);
  }




  getCurrentEncounter(cb: any) {
    this.subscriptions.add(this.apiRequest.postRequest(`${this.appService.baseURI}/GetBaseViewListByPost/bv_core_inpatientappointments`, this.createEncounterFilter())
      .subscribe(
        encList => {
          if (encList && Array.isArray(encList) && encList.length > 0) {


            let activeInpatientEncounter = encList.filter(rec => rec.patientclasscode && (rec.patientclasscode.toLowerCase() == 'ip' || rec.patientclasscode.toLowerCase() == 'i')
              && rec.dischargedatetime == null
              && rec.episodestatuscode && rec.episodestatuscode.toLowerCase() != 'cancelled');



            if (activeInpatientEncounter && activeInpatientEncounter.length > 0) {
              cb(activeInpatientEncounter[0]);
            }
            else {
              cb(null)
            }

          }
          else {
            cb(null)

          }

        }));

  }

  GetMetaData() {
    let decodedToken: any;
    if (this.appService.apiService) {
      decodedToken = this.appService.decodeAccessToken(this.appService.apiService.authService.user.access_token);
      if (decodedToken != null) {
        this.getUserRoles(decodedToken);
        this.appService.loggedInUserName = decodedToken.name ? (Array.isArray(decodedToken.name) ? decodedToken.name[0] : decodedToken.name) : decodedToken.IPUId;
        this.appService.logToConsole(`User Name: ${decodedToken.name}`);
        this.appService.logToConsole(`User Role: ${decodedToken.client_SynapseRoles}`);

        if (!environment.production)
          this.appService.loggedInUserName = "Dev Team";


        this.appService.logToConsole(this.appService.loggedInUserName);

        //get actions for rbac
        this.subscriptions.add(this.apiRequest.postRequest(`${this.appService.baseURI}/GetBaseViewListByPost/rbac_actions`, this.createRoleFilter(decodedToken))
          .subscribe((response: action[]) => {
            this.appService.roleActions = response;

            if (!environment.production) {
              this.getCurrentEncounter((encounter: any) => {

                this.appService.encounter = encounter;
                this.appService.setPatientAgeAtAdmission()
                //assign the badge for dev mode
                this.moduleContext = BadgeNames.NEWS2Monitoring;
                this.initComplete = true;
              });
            }

            if (this.appService.encounter) {
              this.initComplete = true;
            }

          }));

        if (!Object.values(BadgeNames).includes(this.moduleContext)) {
          this.subjects.closeModal.next(undefined);
        }

      }

    }
  }

  createRoleFilter(decodedToken: any) {

    let condition = "";
    let pm = new filterParams();
    let synapseroles;
    if (environment.production)
      synapseroles = decodedToken.SynapseRoles
    else
      synapseroles = decodedToken.client_SynapseRoles
    if (!Array.isArray(synapseroles)) {
      condition = "rolename = @rolename";
      pm.filterparams.push(new filterparam("rolename", synapseroles));
    }
    else
      for (var i = 0; i < synapseroles.length; i++) {
        condition += "or rolename = @rolename" + i + " ";
        pm.filterparams.push(new filterparam("rolename" + i, synapseroles[i]));
      }
    condition = condition.replace(/^\or+|\or+$/g, '');
    let f = new filters();
    f.filters.push(new filter(condition));


    let select = new selectstatement("SELECT *");

    let orderby = new orderbystatement("ORDER BY 1");

    let body = [];
    body.push(f);
    body.push(pm);
    body.push(select);
    body.push(orderby);

    return JSON.stringify(body);
  }

  getUserRoles(decodedToken: any) {
    this.appService.loggedInUserRoles = [];
    let synapseroles;
    if (environment.production)
      synapseroles = decodedToken.SynapseRoles
    else
      synapseroles = decodedToken.client_SynapseRoles
    if (!Array.isArray(synapseroles)) {

      this.appService.loggedInUserRoles.push(synapseroles);
    }
    else
      for (var i = 0; i < synapseroles.length; i++) {
        this.appService.loggedInUserRoles.push(synapseroles[i]);
      }

  }

  closeReasonTemplate(): void {
    this.reasonModalValue = '';
    this.showReason = false;
  }

  ngOnDestroy() {
    this.appService.logToConsole("app component being unloaded");

    this.appService.encounter = null;
    this.appService.personId = null;
    this.appService.isCurrentEncouner = null;
    this.appService.reset();
    this.subscriptions.unsubscribe();
    this.appService = null;
  }

}
