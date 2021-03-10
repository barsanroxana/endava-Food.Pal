import { ChangeDetectorRef, Component, NgZone, OnInit } from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Provider } from '../models/provider';
import { ItemStatus } from '../models/provider-catalogue';
import { ProvidersService } from '../services/providers.service';

@Component({
  selector: 'app-provider-edit',
  templateUrl: './provider-edit.component.html',
  styleUrls: ['./provider-edit.component.scss'],
})
export class ProviderEditComponent implements OnInit {
  data$: Observable<Provider>;

  statusDeleted: ItemStatus = ItemStatus.Deleted;

  formGroup: FormGroup;
  nameFormControl: FormControl;

  catalogItems: FormArray;
  providerId: number;

  get nameErrors() {
    return !!this.nameFormControl.errors
      ? Object.keys(this.nameFormControl.errors)
      : [];
  }

  constructor(
    private providerSvc: ProvidersService,
    private formBuilder: FormBuilder,
    private route: ActivatedRoute,
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.route.paramMap.subscribe(params => {
      this.providerId = parseInt(params.get('providerId'));
    });

    this.data$ = this.providerSvc.getProvider(this.providerId).pipe(
      tap((data) => {
        this.fillForm(data);
      })
    );
  }

  initForm() {
    this.nameFormControl = new FormControl(
      {
        value: '',
        updateOn: 'blur',
      },
      [Validators.required, Validators.minLength(5), Validators.maxLength(150)]
    );

    this.catalogItems = new FormArray([]);
    this.formGroup = this.formBuilder.group({
      id: new FormControl(),
      name: this.nameFormControl,
      description: new FormControl(),
      location: new FormControl(),
      catalogue: new FormGroup({
        id: new FormControl(),
        description: new FormControl(),
        items: this.catalogItems,
      }),
    });
  }

  fillForm(data: Provider) {
    this.formGroup.get('id').setValue(data.id);
    this.formGroup.get('name').setValue(data.name);
    this.formGroup.get('description').setValue(data.description);
    this.formGroup.get('location').setValue(data.location);
    this.formGroup
      .get('catalogue.description')
      .setValue(data.catalogue.description);
    this.formGroup.get('catalogue.id').setValue(data.catalogue.id);
    data.catalogue?.items?.forEach((item) => {
      (this.formGroup.get('catalogue.items') as FormArray).push(
        new FormGroup({
          id: new FormControl(item.id),
          name: new FormControl(item.name),
          price: new FormControl(item.price),
          status: new FormControl(ItemStatus.Initial),
        })
      );
    });
    this.formGroup.get('catalogue.items').valueChanges.subscribe((value) => {
      console.log(value);
    });
  }

  save() {
    if (this.formGroup.valid) {
      const form = this.formGroup.value;
      console.log('new name: ', form);
      this.providerSvc.updateProvider(this.formGroup.get('id').value,form);
    } else {
      this.getFormValidationErrors();
    }
  }

  addNewItem() {
    (this.formGroup.get('catalogue.items') as FormArray).push(
      new FormGroup({
        id: new FormControl(),
        name: new FormControl(),
        price: new FormControl(),
        status: new FormControl(ItemStatus.Added),
      })
    );
  }

  delete(indexForm: FormGroup)
  {
    indexForm.get('status').setValue(this.statusDeleted);
  }

  getFormValidationErrors() {
    Object.keys(this.formGroup.controls).forEach((key) => {
      const controlErrors: ValidationErrors = this.formGroup.get(key).errors;
      if (controlErrors != null) {
        Object.keys(controlErrors).forEach((keyError) => {
          console.log(
            'Key control: ' + key + ', keyError: ' + keyError + ', err value: ',
            controlErrors[keyError]
          );
        });
      }
    });
  }
}
