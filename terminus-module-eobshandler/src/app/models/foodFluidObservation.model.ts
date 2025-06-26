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
export class FoodFluidObservation {

    public foodfluidobservation_id: string = '';
    public datestarted: any;
    public datefinished: any;
    public foodtaken: string = '';
    public fluidtaken: string = '';
    public passedurine: string = '';
    public frequencyunitentered: string = '';
    public frequencyentered: string = '';
    public frequencyreason: string = '';
    public frequencyreasonother: string = '';
    public observationfrequency: string = '';
    public createdby: string | undefined = '';
    public lastmodifiedby: string | undefined = '';
    public isedited: boolean = false;
    public person_id: string | undefined = '';
    public encounter_id: string | undefined = '';
    public createdon: any;
    public lastmodifiedon: any;
    public frequencyoptionselected: string = '';
    public reasonforedit: string = '';
    public reasonforeditother: string = '';
    public reasonfordelete: string = '';
    public reasonfordeleteother: string = '';
    public monitoringnotrequired: boolean = false;
}