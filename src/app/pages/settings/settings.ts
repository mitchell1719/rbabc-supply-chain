import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './settings.html',
  styleUrl: './settings.css'
})
export class Settings {

  companyName =
    'RB ABC Holding OPC';

  department =
    'Supply Chain Office';

  systemName =
    'Supply Chain Management System';

  save() {

    alert(
      'Settings saved locally for this UI. Connect this page to Firestore systemSettings before production.'
    );

  }

}