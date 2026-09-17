import {
  Component,
  OnInit,
  signal
} from '@angular/core';

import {
  CommonModule
} from '@angular/common';

import {
  FormsModule
} from '@angular/forms';

import {
  SupplyChainService
} from '../../services/supply-chain.service';

import type {
  Branch
} from '../../models/supply-chain.model';

import {
  DataState
} from '../../components/data-state/data-state';

import {
  LastUpdated
} from '../../components/last-updated/last-updated';

import {
  CopyButton
} from '../../components/copy-button/copy-button';


@Component({

  selector: 'app-branches',

  standalone: true,

  imports: [
    CommonModule,
    FormsModule,
    DataState,
    LastUpdated,
    CopyButton
  ],

  templateUrl:
    './branches.html',

  styleUrl:
    './branches.css'

})
export class Branches
implements OnInit {


  /*
   * =========================================
   * DATABASE BRANCHES
   * =========================================
   */
  readonly branches = signal<Branch[]>([]);


  /*
   * =========================================
   * FORM
   * =========================================
   */
  form: Branch =
    this.createEmptyForm();


  /*
   * =========================================
   * UI STATE
   * =========================================
   */
  readonly loading = signal(false);

  readonly saving = signal(false);

  readonly errorMessage = signal('');

  readonly successMessage = signal('');


  constructor(

    private service:
      SupplyChainService

  ) {}


  /*
   * =========================================
   * PAGE LOAD
   * =========================================
   */
  async ngOnInit():
  Promise<void> {

    await this.loadBranches();

  }


  /*
   * =========================================
   * EMPTY FORM
   * =========================================
   */
  private createEmptyForm():
  Branch {

    return {

      name: '',

      region:
        'VISAYAS',

      headquartersId: '',

      headquartersName: '',

      districtManagerId: '',

      districtManagerName: '',

      rnsId: '',

      rnsName: '',

      active: true

    };

  }


  /*
   * =========================================
   * LOAD DATABASE
   * =========================================
   */
  async loadBranches(
    forceRefresh = false
  ):
  Promise<void> {

    this.loading.set(true);

    this.errorMessage.set('');


    try {

      this.branches.set(
        await this.service
          .getBranches(forceRefresh)
      );

    } catch (error) {

      this.errorMessage.set(
        error instanceof Error
          ? error.message
          : 'Unable to load branches from the database.'
      );


    } finally {

      this.loading.set(false);

    }

  }


  /*
   * =========================================
   * SAVE BRANCH
   * =========================================
   */
  async save():
  Promise<void> {

    this.errorMessage.set('');

    this.successMessage.set('');


    /*
     * Branch name validation
     */
    if (
      !this.form.name.trim()
    ) {

      this.errorMessage.set(
        'Branch name is required.'
      );

      return;

    }


    /*
     * Region validation
     */
    if (
      !this.form.region
    ) {

      this.errorMessage.set(
        'Region is required.'
      );

      return;

    }


    /*
     * Headquarters validation
     */
    if (
      !this.form
        .headquartersName
        .trim()
    ) {

      this.errorMessage.set(
        'Headquarters is required.'
      );

      return;

    }


    /*
     * District Manager validation
     */
    if (
      !this.form
        .districtManagerName
        .trim()
    ) {

      this.errorMessage.set(
        'District Manager is required.'
      );

      return;

    }


    this.saving.set(true);


    try {

      /*
       * Generate IDs if you have not
       * manually entered them.
       */
      const branchToSave:
      Branch = {

        ...this.form,

        headquartersId:
          this.form
            .headquartersId
            .trim()
          ||
          this.generateId(
            this.form
              .headquartersName
          ),

        districtManagerId:
          this.form
            .districtManagerId
            .trim()
          ||
          this.generateId(
            this.form
              .districtManagerName
          ),

        rnsId:
          this.form
            .rnsId
            .trim()
          ||
          this.generateId(
            this.form
              .rnsName
          )

      };


      /*
       * Save to Firestore
       */
      await this.service
        .createBranch(
          branchToSave
        );


      /*
       * Show success
       */
      this.successMessage.set(
        `${branchToSave.name} saved successfully.`
      );


      /*
       * Clear form
       */
      this.form =
        this.createEmptyForm();


      /*
       * Reload database
       *
       * This makes the new branch
       * immediately appear in table.
       */
      await this.loadBranches();


    } catch (error) {

      console.error(
        'SAVE BRANCH ERROR:',
        error
      );


      if (
        error instanceof Error
      ) {

        this.errorMessage.set(
          error.message
        );

      } else {

        this.errorMessage.set(
          'Unable to save branch.'
        );

      }


    } finally {

      this.saving.set(false);

    }

  }


  /*
   * =========================================
   * GENERATE SIMPLE ID
   * =========================================
   */
  private generateId(
    value: string
  ): string {

    return value
      .trim()
      .toUpperCase()
      .replace(
        /[^A-Z0-9]+/g,
        '_'
      )
      .replace(
        /^_+|_+$/g,
        ''
      );

  }

}
