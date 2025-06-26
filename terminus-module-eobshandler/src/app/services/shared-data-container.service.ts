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
import { ApirequestService } from './apirequest.service';
import { AuthenticationService } from './authentication.service';
import { filter, filterParams, filterparam, filters, orderbystatement, selectstatement } from '../models/filter.model';
import { AppService } from './app.service';

@Injectable({
  providedIn: 'root'
})
export class SharedDataContainerService {

  constructor(private apiRequest: ApirequestService, private authService: AuthenticationService,public appService:AppService) { }

  public personId: string = "";
  public encounterId: string;
  public contexts: any;
  public contextField: string = "";
  public contextValue: string = "";



  public ShoModuleLoader = false;
  public currentEWSScale: string;
  public refWeightValue: number;
  public refHeightValue: number;
  public showsecondaryBanner=true;
  public showClinicInformation=false;
  public showExpandedBanner=false;
  
}
