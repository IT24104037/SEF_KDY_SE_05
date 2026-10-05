import 'package:flutter/material.dart';

import '../../../app/app_router.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/role_scaffold.dart';
import '../services/worker_service.dart';
import 'worker_dashboard_screen.dart';

class AvailabilityScreen extends StatefulWidget {
  const AvailabilityScreen({super.key});

  @override
  State<AvailabilityScreen> createState() => _AvailabilityScreenState();
}

class _AvailabilityScreenState extends State<AvailabilityScreen> {
  static const List<String> _days = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ];

  final WorkerService _service = WorkerService.instance;

  List<Map<String, dynamic>> _slots = [];

  bool _freeNow = false;
  bool _loading = true;
  bool _saving = false;

  String? _error;
  String? _message;

  int _selectedDay = 1;

  TimeOfDay _start = const TimeOfDay(hour: 8, minute: 0);

  TimeOfDay _end = const TimeOfDay(hour: 17, minute: 0);

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final data = await _service.getAvailability();

      final rawSlots = data['slots'];

      if (!mounted) return;

      setState(() {
        _freeNow = data['freeNow'] == true;

        _slots = rawSlots is List
            ? rawSlots
                  .whereType<Map>()
                  .map((item) => Map<String, dynamic>.from(item))
                  .toList()
            : [];
      });
    } catch (error) {
      if (!mounted) return;

      setState(() {
        _error = error.toString();
      });
    } finally {
      if (mounted) {
        setState(() {
          _loading = false;
        });
      }
    }
  }

  String _twoDigits(int value) => value.toString().padLeft(2, '0');

  String _timeString(TimeOfDay time) {
    return '${_twoDigits(time.hour)}:${_twoDigits(time.minute)}:00';
  }

  String _displayTime(dynamic value) {
    if (value == null) {
      return '-';
    }

    final text = value.toString();

    return text.length >= 5 ? text.substring(0, 5) : text;
  }

  int _dayNumber(dynamic value) {
    if (value is int) {
      return value;
    }

    final number = int.tryParse(value.toString());

    if (number != null) {
      return number;
    }

    final index = _days.indexOf(value.toString());

    return index >= 0 ? index : 0;
  }

  Future<void> _saveSlots(List<Map<String, dynamic>> slots) async {
    setState(() {
      _saving = true;
      _error = null;
      _message = null;
    });

    try {
      final data = await _service.updateAvailability(slots);

      final raw = data['slots'];

      if (!mounted) return;

      setState(() {
        _freeNow = data['freeNow'] == true;

        _slots = raw is List
            ? raw
                  .whereType<Map>()
                  .map((item) => Map<String, dynamic>.from(item))
                  .toList()
            : [];

        _message = 'Availability updated successfully.';
      });
    } catch (error) {
      if (!mounted) return;

      setState(() {
        _error = error.toString();
      });
    } finally {
      if (mounted) {
        setState(() {
          _saving = false;
        });
      }
    }
  }

  Future<void> _applyPreset(String preset) async {
    if (_saving) return;

    final days = preset == 'clear'
        ? <int>[]
        : preset == 'weekend'
        ? <int>[6, 0]
        : <int>[1, 2, 3, 4, 5];

    await _saveSlots([
      for (final day in days)
        {
          'dayOfWeek': day,
          'startTime': preset == 'weekend' ? '09:00:00' : '08:00:00',
          'endTime': preset == 'morning' ? '12:00:00' : '17:00:00',
          'isActive': true,
        },
    ]);
  }

  Future<void> _addSlot() async {
    final startMinutes = _start.hour * 60 + _start.minute;

    final endMinutes = _end.hour * 60 + _end.minute;

    if (endMinutes <= startMinutes) {
      setState(() {
        _error = 'End time must be later than start time.';
      });
      return;
    }

    final newSlot = <String, dynamic>{
      'dayOfWeek': _selectedDay,
      'startTime': _timeString(_start),
      'endTime': _timeString(_end),
      'isActive': true,
    };

    await _saveSlots([..._slots, newSlot]);
  }

  Future<void> _removeSlot(int index) async {
    final updated = List<Map<String, dynamic>>.from(_slots);

    updated.removeAt(index);

    await _saveSlots(updated);
  }

  Future<void> _pickStart() async {
    final value = await showTimePicker(context: context, initialTime: _start);

    if (value != null) {
      setState(() {
        _start = value;
      });
    }
  }

  Future<void> _pickEnd() async {
    final value = await showTimePicker(context: context, initialTime: _end);

    if (value != null) {
      setState(() {
        _end = value;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return RoleScaffold(
      title: 'Availability',
      roleLabel: 'Maintenance Worker',
      expectedRole: 'MaintenanceWorker',
      accentColor: AppColors.workerAccent,
      menuItems: WorkerDashboardScreen.menuItems,
      currentRoute: AppRoutes.workerAvailability,
      showBackButton: true,

      child: ListView(
        padding: const EdgeInsets.all(20),

        children: [
          const Text(
            'Availability',
            style: TextStyle(
              color: AppColors.heading,
              fontSize: 24,
              fontWeight: FontWeight.w800,
            ),
          ),

          const SizedBox(height: 6),

          const Text(
            'Set the times you are available for maintenance work.',
            style: TextStyle(color: AppColors.secondaryText),
          ),

          const SizedBox(height: 20),

          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: _freeNow
                  ? AppColors.successBackground
                  : const Color(0xFFFFF7ED),
              borderRadius: BorderRadius.circular(10),
              border: Border.all(
                color: _freeNow
                    ? AppColors.successBorder
                    : const Color(0xFFFED7AA),
              ),
            ),
            child: Row(
              children: [
                Icon(
                  _freeNow ? Icons.check_circle_outline : Icons.schedule,
                  color: _freeNow ? AppColors.success : AppColors.workerAccent,
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    _freeNow
                        ? 'You are currently within an available shift.'
                        : 'You are currently outside your available shifts.',
                    style: TextStyle(
                      color: _freeNow
                          ? AppColors.success
                          : AppColors.workerAccent,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ],
            ),
          ),

          Wrap(
            spacing: 8,
            children: [
              TextButton(
                onPressed: _saving ? null : () => _applyPreset('weekdays'),
                child: const Text('Weekdays 08–17'),
              ),
              TextButton(
                onPressed: _saving ? null : () => _applyPreset('morning'),
                child: const Text('Weekdays 08–12'),
              ),
              TextButton(
                onPressed: _saving ? null : () => _applyPreset('weekend'),
                child: const Text('Weekend 09–17'),
              ),
              TextButton(
                onPressed: _saving ? null : () => _applyPreset('clear'),
                child: const Text('Clear All Shifts'),
              ),
            ],
          ),
          if (_message != null) ...[
            const SizedBox(height: 12),
            Text(_message!, style: const TextStyle(color: AppColors.success)),
          ],

          if (_error != null) ...[
            const SizedBox(height: 12),
            Text(_error!, style: const TextStyle(color: AppColors.error)),
          ],

          const SizedBox(height: 24),

          Container(
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(
              color: AppColors.surface,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: AppColors.border),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Add Shift',
                  style: TextStyle(
                    color: AppColors.heading,
                    fontWeight: FontWeight.w700,
                    fontSize: 17,
                  ),
                ),

                const SizedBox(height: 16),

                DropdownButtonFormField<int>(
                  initialValue: _selectedDay,
                  decoration: const InputDecoration(labelText: 'Day'),
                  items: List.generate(
                    _days.length,
                    (index) => DropdownMenuItem(
                      value: index,
                      child: Text(_days[index]),
                    ),
                  ),
                  onChanged: (value) {
                    if (value != null) {
                      setState(() {
                        _selectedDay = value;
                      });
                    }
                  },
                ),

                const SizedBox(height: 14),

                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton.icon(
                        onPressed: _pickStart,
                        icon: const Icon(Icons.schedule_outlined),
                        label: Text('Start ${_start.format(context)}'),
                      ),
                    ),

                    const SizedBox(width: 10),

                    Expanded(
                      child: OutlinedButton.icon(
                        onPressed: _pickEnd,
                        icon: const Icon(Icons.schedule_outlined),
                        label: Text('End ${_end.format(context)}'),
                      ),
                    ),
                  ],
                ),

                const SizedBox(height: 14),

                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton.icon(
                    onPressed: _saving ? null : _addSlot,
                    icon: const Icon(Icons.add),
                    label: Text(_saving ? 'Saving...' : 'Add Availability'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.workerAccent,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                    ),
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(height: 22),

          const Text(
            'Current Schedule',
            style: TextStyle(
              color: AppColors.heading,
              fontWeight: FontWeight.w700,
              fontSize: 18,
            ),
          ),

          const SizedBox(height: 12),

          if (_loading)
            const Center(
              child: CircularProgressIndicator(color: AppColors.workerAccent),
            )
          else if (_slots.isEmpty)
            Container(
              padding: const EdgeInsets.all(22),
              decoration: BoxDecoration(
                color: AppColors.surface,
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: AppColors.border),
              ),
              child: const Text(
                'No availability shifts have been added yet.',
                textAlign: TextAlign.center,
                style: TextStyle(color: AppColors.secondaryText),
              ),
            )
          else
            ...List.generate(_slots.length, (index) {
              final slot = _slots[index];

              final day = _dayNumber(slot['dayOfWeek']);

              return Container(
                margin: const EdgeInsets.only(bottom: 10),
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: AppColors.surface,
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: AppColors.border),
                ),
                child: Row(
                  children: [
                    const Icon(
                      Icons.calendar_today_outlined,
                      color: AppColors.workerAccent,
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            _days[day],
                            style: const TextStyle(
                              color: AppColors.heading,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                          const SizedBox(height: 3),
                          Text(
                            '${_displayTime(slot['startTime'])} - ${_displayTime(slot['endTime'])}',
                            style: const TextStyle(
                              color: AppColors.secondaryText,
                            ),
                          ),
                        ],
                      ),
                    ),
                    IconButton(
                      tooltip: 'Remove shift',
                      onPressed: _saving ? null : () => _removeSlot(index),
                      icon: const Icon(
                        Icons.delete_outline,
                        color: AppColors.error,
                      ),
                    ),
                  ],
                ),
              );
            }),
        ],
      ),
    );
  }
}
