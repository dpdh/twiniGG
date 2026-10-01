import 'dart:async';
import 'dart:convert';
import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

void main() {
  runApp(const TwinkiCityApp());
}

const Color forest = Color(0xFF173F34);
const Color leaf = Color(0xFF2C7552);
const Color lime = Color(0xFFD9EF69);
const Color paper = Color(0xFFF5F6EC);
const Color ink = Color(0xFF193B31);
const Color mutedInk = Color(0xFF718178);
const MethodChannel gameSaveChannel = MethodChannel('com.twinkicity/game_save');

const List<GameZone> gameZones = [
  GameZone(name: 'Twin Village', icon: Icons.home_work_rounded),
  GameZone(name: 'BIM District', icon: Icons.apartment_rounded),
  GameZone(name: 'Green City', icon: Icons.eco_rounded),
];

const List<CampaignMission> gameMissions = [
  CampaignMission(
    id: 'TV-001',
    zone: 'Twin Village',
    title: 'Kenalan dengan Twinki',
    description: 'Bangunkan kota pertamamu dan kenali cara kerja Digital Twin.',
    xp: 200,
    twinPoints: 25,
    objectives: [
      'Periksa aset di zona ini',
      'Validasi data digital twin',
      'Terapkan dan verifikasi perbaikan',
    ],
  ),
  CampaignMission(
    id: 'TV-002',
    zone: 'Twin Village',
    title: 'Bangun gedung pertama',
    description: 'Rangkai struktur yang aman sebelum warga pindah masuk.',
    xp: 300,
    coins: 40,
    objectives: [
      'Pilih lokasi bangunan',
      'Pasang struktur utama',
      'Validasi kondisi bangunan',
    ],
  ),
  CampaignMission(
    id: 'TV-003',
    zone: 'Twin Village',
    title: 'Pindai lingkungan',
    description: 'Temukan perbedaan kecil antara kota nyata dan model BIM.',
    xp: 350,
    blueprints: 1,
    objectives: [
      'Luncurkan pemindai',
      'Bandingkan hasil dengan BIM',
      'Tandai perubahan aset',
    ],
  ),
  CampaignMission(
    id: 'BIM-001',
    zone: 'BIM District',
    title: 'Pemburu benturan',
    description: 'Cari jalur pipa yang bertabrakan dengan balok bangunan.',
    xp: 420,
    twinPoints: 30,
    objectives: [
      'Buka model struktur',
      'Temukan benturan MEP',
      'Simpan solusi koordinasi',
    ],
  ),
  CampaignMission(
    id: 'BIM-002',
    zone: 'BIM District',
    title: 'Audit data aset',
    description: 'Pastikan informasi aset siap dipakai oleh tim lapangan.',
    xp: 380,
    coins: 60,
    objectives: [
      'Pilih aset kritis',
      'Periksa data aset',
      'Terbitkan hasil audit',
    ],
  ),
  CampaignMission(
    id: 'GC-001',
    zone: 'Green City',
    title: 'Kota bernapas',
    description: 'Seimbangkan energi, ruang hijau, dan kebutuhan warga.',
    xp: 500,
    twinPoints: 50,
    objectives: [
      'Temukan area panas',
      'Rancang solusi hijau',
      'Ukur dampak perubahan',
    ],
  ),
];

class GameZone {
  const GameZone({required this.name, required this.icon});

  final String name;
  final IconData icon;
}

class CampaignMission {
  const CampaignMission({
    required this.id,
    required this.zone,
    required this.title,
    required this.description,
    required this.xp,
    required this.objectives,
    this.twinPoints = 0,
    this.coins = 0,
    this.blueprints = 0,
  });

  final String id;
  final String zone;
  final String title;
  final String description;
  final int xp;
  final int twinPoints;
  final int coins;
  final int blueprints;
  final List<String> objectives;

  String get rewardLabel => [
    '+$xp XP',
    if (twinPoints > 0) '+$twinPoints Twin Point',
    if (coins > 0) '+$coins koin',
    if (blueprints > 0) '+$blueprints cetak biru',
  ].join('  ·  ');
}

class TwinkiCityApp extends StatefulWidget {
  const TwinkiCityApp({super.key});

  @override
  State<TwinkiCityApp> createState() => _TwinkiCityAppState();
}

class _TwinkiCityAppState extends State<TwinkiCityApp>
    with SingleTickerProviderStateMixin {
  late final AnimationController _windController;
  int _selectedTab = 0;
  int _selectedZone = 0;
  String _selectedMissionId = gameMissions.first.id;
  final Set<String> _completed = {};
  final Map<String, int> _steps = {};
  int _xp = 12600;
  int _coins = 2480;
  int _twinPoints = 480;
  int _blueprints = 0;
  bool _hasLoadedSave = false;

  @override
  void initState() {
    super.initState();
    _windController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 18),
    )..repeat();
    unawaited(_loadGame());
  }

  @override
  void dispose() {
    _windController.dispose();
    super.dispose();
  }

  List<CampaignMission> get _zoneMissions => gameMissions
      .where((mission) => mission.zone == gameZones[_selectedZone].name)
      .toList();

  CampaignMission get _selectedMission => gameMissions.firstWhere(
    (mission) => mission.id == _selectedMissionId,
    orElse: () => gameMissions.first,
  );

  bool _isZoneUnlocked(int index) {
    if (index == 0) return true;
    final previous = gameMissions.where(
      (mission) => mission.zone == gameZones[index - 1].name,
    );
    return previous.isNotEmpty &&
        previous.every((mission) => _completed.contains(mission.id));
  }

  bool _isMissionUnlocked(CampaignMission mission) {
    final missions = gameMissions
        .where((item) => item.zone == mission.zone)
        .toList();
    final index = missions.indexOf(mission);
    return index == 0 || _completed.contains(missions[index - 1].id);
  }

  CampaignMission? _nextMissionInZone(String zone) {
    for (final mission in gameMissions.where((item) => item.zone == zone)) {
      if (!_completed.contains(mission.id) && _isMissionUnlocked(mission)) {
        return mission;
      }
    }
    return null;
  }

  void _selectMission(CampaignMission mission) {
    if (!_isMissionUnlocked(mission)) return;
    setState(() => _selectedMissionId = mission.id);
    unawaited(_saveGame());
  }

  void _completeObjective(CampaignMission mission) {
    final step = _steps[mission.id] ?? 0;
    if (step >= mission.objectives.length || !_isMissionUnlocked(mission)) {
      return;
    }

    setState(() {
      final nextStep = step + 1;
      _steps[mission.id] = nextStep;
      if (nextStep == mission.objectives.length) {
        _completed.add(mission.id);
        _xp += mission.xp;
        _twinPoints += mission.twinPoints;
        _coins += mission.coins;
        _blueprints += mission.blueprints;
        final nextMission = _nextMissionInZone(mission.zone);
        if (nextMission != null) _selectedMissionId = nextMission.id;
      }
    });
    unawaited(_saveGame());
  }

  void _openZone(int index) {
    if (!_isZoneUnlocked(index)) return;
    setState(() {
      _selectedZone = index;
      final next = _nextMissionInZone(gameZones[index].name);
      if (next != null) _selectedMissionId = next.id;
      _selectedTab = 1;
    });
    unawaited(_saveGame());
  }

  Future<void> _loadGame() async {
    try {
      final rawSave = await gameSaveChannel.invokeMethod<String>('load');
      if (rawSave == null || rawSave.isEmpty) return;

      final decoded = jsonDecode(rawSave);
      if (decoded is! Map<String, dynamic>) return;
      final knownMissionIds = gameMissions.map((mission) => mission.id).toSet();
      final completed = (decoded['completed'] as List<dynamic>? ?? const [])
          .whereType<String>()
          .where(knownMissionIds.contains)
          .toSet();
      final restoredSteps = <String, int>{};
      final rawSteps = decoded['steps'];
      if (rawSteps is Map) {
        for (final entry in rawSteps.entries) {
          if (entry.key is String &&
              entry.value is num &&
              knownMissionIds.contains(entry.key)) {
            final mission = gameMissions.firstWhere(
              (item) => item.id == entry.key,
            );
            restoredSteps[entry.key as String] = (entry.value as num)
                .toInt()
                .clamp(0, mission.objectives.length);
          }
        }
      }

      var restoredZone = gameZones.indexWhere(
        (zone) => zone.name == decoded['zone'],
      );
      if (restoredZone < 0) restoredZone = 0;
      while (restoredZone > 0) {
        final previousMissions = gameMissions.where(
          (mission) => mission.zone == gameZones[restoredZone - 1].name,
        );
        if (previousMissions.isNotEmpty &&
            previousMissions.every(
              (mission) => completed.contains(mission.id),
            )) {
          break;
        }
        restoredZone--;
      }

      final zoneMissions = gameMissions
          .where((mission) => mission.zone == gameZones[restoredZone].name)
          .toList();
      final savedMissionId = decoded['mission'];
      final savedMissionIndex = zoneMissions.indexWhere(
        (mission) => mission.id == savedMissionId,
      );
      final savedMissionUnlocked =
          savedMissionIndex == 0 ||
          (savedMissionIndex > 0 &&
              completed.contains(zoneMissions[savedMissionIndex - 1].id));
      CampaignMission? nextMission;
      for (var index = 0; index < zoneMissions.length; index++) {
        if (!completed.contains(zoneMissions[index].id) &&
            (index == 0 || completed.contains(zoneMissions[index - 1].id))) {
          nextMission = zoneMissions[index];
          break;
        }
      }
      final restoredMissionId = savedMissionIndex >= 0 && savedMissionUnlocked
          ? savedMissionId as String
          : nextMission?.id ?? zoneMissions.last.id;

      if (!mounted) return;
      setState(() {
        _completed
          ..clear()
          ..addAll(completed);
        _steps
          ..clear()
          ..addAll(restoredSteps);
        _selectedZone = restoredZone;
        _selectedMissionId = restoredMissionId;
        _xp = (decoded['xp'] as num?)?.toInt() ?? _xp;
        _coins = (decoded['coins'] as num?)?.toInt() ?? _coins;
        _twinPoints = (decoded['twinPoints'] as num?)?.toInt() ?? _twinPoints;
        _blueprints = (decoded['blueprints'] as num?)?.toInt() ?? _blueprints;
      });
    } on MissingPluginException {
      // Widget tests and unsupported targets use the default in-memory state.
    } on PlatformException {
      // Keep the game playable if native storage is temporarily unavailable.
    } on FormatException {
      // Ignore malformed saves and start a fresh campaign.
    } finally {
      _hasLoadedSave = true;
    }
  }

  Future<void> _saveGame() async {
    if (!_hasLoadedSave) return;
    final payload = jsonEncode({
      'version': 1,
      'zone': gameZones[_selectedZone].name,
      'mission': _selectedMissionId,
      'completed': _completed.toList(),
      'steps': _steps,
      'xp': _xp,
      'coins': _coins,
      'twinPoints': _twinPoints,
      'blueprints': _blueprints,
    });
    try {
      await gameSaveChannel.invokeMethod<bool>('save', payload);
    } on MissingPluginException {
      // Widget tests and unsupported targets keep state in memory only.
    } on PlatformException {
      // Do not interrupt gameplay if a save fails.
    }
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Twinki Twin City',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        useMaterial3: true,
        scaffoldBackgroundColor: paper,
        colorScheme: ColorScheme.fromSeed(seedColor: forest).copyWith(
          primary: forest,
          secondary: leaf,
          surface: const Color(0xFFFCFDF8),
        ),
        textTheme: const TextTheme(
          headlineMedium: TextStyle(
            fontSize: 28,
            fontWeight: FontWeight.w800,
            height: 1.08,
            color: ink,
          ),
          titleLarge: TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.w800,
            color: ink,
          ),
          titleMedium: TextStyle(
            fontSize: 15,
            fontWeight: FontWeight.w700,
            color: ink,
          ),
          bodyMedium: TextStyle(fontSize: 14, height: 1.45, color: mutedInk),
          labelLarge: TextStyle(fontSize: 13, fontWeight: FontWeight.w800),
        ),
      ),
      home: Scaffold(
        body: SafeArea(child: _buildPage()),
        bottomNavigationBar: NavigationBar(
          selectedIndex: _selectedTab,
          onDestinationSelected: (index) =>
              setState(() => _selectedTab = index),
          backgroundColor: const Color(0xFFFCFDF8),
          indicatorColor: lime.withValues(alpha: 0.62),
          destinations: const [
            NavigationDestination(
              icon: Icon(Icons.grid_view_rounded),
              label: 'Beranda',
            ),
            NavigationDestination(
              icon: Icon(Icons.assignment_rounded),
              label: 'Misi',
            ),
            NavigationDestination(icon: Icon(Icons.map_rounded), label: 'Kota'),
            NavigationDestination(
              icon: Icon(Icons.person_rounded),
              label: 'Profil',
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPage() {
    return switch (_selectedTab) {
      0 => _buildHomePage(),
      1 => _buildMissionsPage(),
      2 => _buildCityPage(),
      _ => _buildProfilePage(),
    };
  }

  Widget _buildHomePage() {
    final mission =
        _nextMissionInZone(gameZones[_selectedZone].name) ?? _selectedMission;
    final progress = _steps[mission.id] ?? 0;
    final totalMissions = gameMissions.length;
    final completedCount = _completed.length;
    final zonesOpen = List.generate(
      gameZones.length,
      _isZoneUnlocked,
    ).where((open) => open).length;

    return ListView(
      padding: const EdgeInsets.fromLTRB(20, 14, 20, 28),
      children: [
        _buildTopBar(),
        const SizedBox(height: 22),
        _buildCityHero(),
        const SizedBox(height: 20),
        _buildMissionSpotlight(mission, progress),
        const SizedBox(height: 20),
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text('KOTA KITA HARI INI', style: _eyebrowStyle),
            Text(
              '$completedCount/$totalMissions misi',
              style: const TextStyle(
                color: mutedInk,
                fontSize: 12,
                fontWeight: FontWeight.w700,
              ),
            ),
          ],
        ),
        const SizedBox(height: 10),
        GridView.count(
          crossAxisCount: 2,
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          mainAxisSpacing: 10,
          crossAxisSpacing: 10,
          childAspectRatio: 1.72,
          children: [
            _StatTile(
              icon: Icons.bolt_rounded,
              label: 'Energi',
              value: '92%',
              color: const Color(0xFFF5D779),
            ),
            _StatTile(
              icon: Icons.map_rounded,
              label: 'Zona terbuka',
              value: '$zonesOpen/${gameZones.length}',
              color: const Color(0xFFB9DB8A),
            ),
            _StatTile(
              icon: Icons.auto_awesome_rounded,
              label: 'Kematangan Twin',
              value: 'Level 5',
              color: const Color(0xFFEDAA83),
            ),
            _StatTile(
              icon: Icons.local_fire_department_rounded,
              label: 'Streak',
              value: '3 hari',
              color: const Color(0xFFC1B4E7),
            ),
          ],
        ),
        const SizedBox(height: 18),
        _buildTwinkiNote(),
      ],
    );
  }

  Widget _buildTopBar() {
    return Row(
      children: [
        Container(
          width: 46,
          height: 46,
          decoration: BoxDecoration(
            color: lime,
            borderRadius: BorderRadius.circular(15),
          ),
          child: const Icon(Icons.smart_toy_rounded, color: forest, size: 27),
        ),
        const SizedBox(width: 11),
        const Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('SELAMAT DATANG KEMBALI', style: _eyebrowStyle),
              SizedBox(height: 2),
              Text(
                'Adit Twin',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w800,
                  color: ink,
                ),
              ),
            ],
          ),
        ),
        _currencyPill(
          Icons.star_rounded,
          _xp.toString(),
          const Color(0xFFFFD875),
        ),
        const SizedBox(width: 6),
        _currencyPill(
          Icons.toll_rounded,
          _coins.toString(),
          const Color(0xFFBDE179),
        ),
      ],
    );
  }

  Widget _currencyPill(IconData icon, String value, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 8),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(13),
        border: Border.all(color: ink.withValues(alpha: 0.07)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 15, color: forest),
          const SizedBox(width: 4),
          Text(
            value,
            style: const TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w800,
              color: ink,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCityHero() {
    return Container(
      height: 292,
      clipBehavior: Clip.antiAlias,
      decoration: BoxDecoration(
        color: forest,
        borderRadius: BorderRadius.circular(24),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(18, 16, 18, 8),
            child: Row(
              children: [
                const Icon(Icons.location_on_rounded, color: lime, size: 17),
                const SizedBox(width: 4),
                const Expanded(
                  child: Text(
                    'TWIN VILLAGE  /  HARI KE-03',
                    style: TextStyle(
                      color: Color(0xFFE8F4D2),
                      fontSize: 10,
                      fontWeight: FontWeight.w800,
                      letterSpacing: 1,
                    ),
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 8,
                    vertical: 5,
                  ),
                  decoration: BoxDecoration(
                    color: lime,
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: const Text(
                    'LIVE',
                    style: TextStyle(
                      color: forest,
                      fontSize: 9,
                      fontWeight: FontWeight.w900,
                    ),
                  ),
                ),
              ],
            ),
          ),
          Expanded(
            child: AnimatedBuilder(
              animation: _windController,
              builder: (context, child) => CustomPaint(
                painter: _CityPainter(
                  rotation: _windController.value * math.pi * 2,
                ),
                child: const SizedBox.expand(),
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(18, 2, 18, 17),
            child: Row(
              children: [
                const Expanded(
                  child: Text(
                    'Kota tumbuh saat kamu bergerak.',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 17,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                ),
                Container(
                  width: 38,
                  height: 38,
                  decoration: BoxDecoration(
                    color: const Color(0xFFE8F4D2),
                    borderRadius: BorderRadius.circular(13),
                  ),
                  child: const Center(
                    child: Text('🤖', style: TextStyle(fontSize: 22)),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMissionSpotlight(CampaignMission mission, int progress) {
    final completed = _completed.contains(mission.id);
    return Container(
      padding: const EdgeInsets.all(17),
      decoration: BoxDecoration(
        color: const Color(0xFFFFFDF5),
        borderRadius: BorderRadius.circular(19),
        border: Border.all(color: const Color(0xFFE7DEC5)),
        boxShadow: const [
          BoxShadow(
            color: Color(0x0D193B31),
            blurRadius: 18,
            offset: Offset(0, 8),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.flag_rounded, color: leaf, size: 17),
              const SizedBox(width: 6),
              const Text('MISI BERIKUTNYA', style: _eyebrowStyle),
              const Spacer(),
              Text(
                completed
                    ? 'ZONA SELESAI'
                    : '$progress/${mission.objectives.length} LANGKAH',
                style: const TextStyle(
                  color: leaf,
                  fontWeight: FontWeight.w900,
                  fontSize: 10,
                ),
              ),
            ],
          ),
          const SizedBox(height: 9),
          Text(
            mission.title,
            style: const TextStyle(
              fontSize: 19,
              fontWeight: FontWeight.w800,
              color: ink,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            mission.description,
            style: const TextStyle(color: mutedInk, height: 1.4, fontSize: 12),
          ),
          const SizedBox(height: 13),
          ClipRRect(
            borderRadius: BorderRadius.circular(10),
            child: LinearProgressIndicator(
              value: progress / mission.objectives.length,
              minHeight: 7,
              backgroundColor: const Color(0xFFE9EBDD),
              color: leaf,
            ),
          ),
          const SizedBox(height: 13),
          Row(
            children: [
              Expanded(
                child: Text(
                  mission.rewardLabel,
                  style: const TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w800,
                    color: leaf,
                  ),
                ),
              ),
              TextButton(
                onPressed: () => setState(() => _selectedTab = 1),
                style: TextButton.styleFrom(
                  foregroundColor: forest,
                  padding: const EdgeInsets.symmetric(horizontal: 12),
                ),
                child: const Text(
                  'BUKA MISI  →',
                  style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildTwinkiNote() {
    return Container(
      padding: const EdgeInsets.all(15),
      decoration: BoxDecoration(
        color: const Color(0xFFE4F0DB),
        borderRadius: BorderRadius.circular(16),
      ),
      child: const Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('🤖', style: TextStyle(fontSize: 25)),
          SizedBox(width: 11),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('TWINKI BILANG', style: _eyebrowStyle),
                SizedBox(height: 4),
                Text(
                  '“Tiga langkah kecil bisa mengubah satu kota. Kita mulai dari mana?”',
                  style: TextStyle(
                    color: ink,
                    height: 1.4,
                    fontWeight: FontWeight.w600,
                    fontSize: 13,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMissionsPage() {
    final zone = gameZones[_selectedZone];
    return ListView(
      padding: const EdgeInsets.fromLTRB(20, 18, 20, 28),
      children: [
        const Text('KAMPANYE KOTA', style: _eyebrowStyle),
        const SizedBox(height: 5),
        const Text(
          'Pilih langkah berikutnya.',
          style: TextStyle(
            fontSize: 25,
            fontWeight: FontWeight.w800,
            color: ink,
          ),
        ),
        const SizedBox(height: 7),
        const Text(
          'Selesaikan misi berurutan untuk membuka zona baru.',
          style: TextStyle(color: mutedInk, fontSize: 13),
        ),
        const SizedBox(height: 18),
        SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          child: Row(
            children: List.generate(gameZones.length, (index) {
              final open = _isZoneUnlocked(index);
              final selected = index == _selectedZone;
              return Padding(
                padding: const EdgeInsets.only(right: 8),
                child: ChoiceChip(
                  avatar: Icon(
                    open ? gameZones[index].icon : Icons.lock_rounded,
                    size: 15,
                    color: selected ? lime : mutedInk,
                  ),
                  label: Text(gameZones[index].name),
                  selected: selected,
                  onSelected: open
                      ? (_) => setState(() => _selectedZone = index)
                      : null,
                  selectedColor: forest,
                  backgroundColor: Colors.white,
                  labelStyle: TextStyle(
                    color: selected ? Colors.white : (open ? ink : mutedInk),
                    fontSize: 11,
                    fontWeight: FontWeight.w800,
                  ),
                  side: BorderSide(
                    color: selected ? forest : ink.withValues(alpha: 0.08),
                  ),
                  showCheckmark: false,
                ),
              );
            }),
          ),
        ),
        const SizedBox(height: 17),
        Row(
          children: [
            Icon(zone.icon, color: leaf, size: 20),
            const SizedBox(width: 7),
            Text(
              zone.name,
              style: const TextStyle(
                fontSize: 17,
                color: ink,
                fontWeight: FontWeight.w800,
              ),
            ),
            const Spacer(),
            Text(
              '${_zoneMissions.where((mission) => _completed.contains(mission.id)).length}/${_zoneMissions.length} SELESAI',
              style: const TextStyle(
                fontSize: 9,
                color: mutedInk,
                fontWeight: FontWeight.w900,
              ),
            ),
          ],
        ),
        const SizedBox(height: 10),
        ..._zoneMissions.map(_buildMissionCard),
      ],
    );
  }

  Widget _buildMissionCard(CampaignMission mission) {
    final unlocked = _isMissionUnlocked(mission);
    final complete = _completed.contains(mission.id);
    final selected = mission.id == _selectedMissionId;
    final progress = _steps[mission.id] ?? 0;

    return Opacity(
      opacity: unlocked ? 1 : 0.55,
      child: Container(
        margin: const EdgeInsets.only(bottom: 11),
        decoration: BoxDecoration(
          color: selected ? const Color(0xFFFFFDF5) : Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: selected
                ? leaf.withValues(alpha: 0.55)
                : ink.withValues(alpha: 0.08),
          ),
        ),
        child: Column(
          children: [
            InkWell(
              borderRadius: BorderRadius.circular(16),
              onTap: unlocked ? () => _selectMission(mission) : null,
              child: Padding(
                padding: const EdgeInsets.all(14),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      width: 34,
                      height: 34,
                      decoration: BoxDecoration(
                        color: complete
                            ? const Color(0xFFDDF1D3)
                            : const Color(0xFFF0F2E7),
                        borderRadius: BorderRadius.circular(11),
                      ),
                      child: Icon(
                        complete
                            ? Icons.check_rounded
                            : unlocked
                            ? Icons.route_rounded
                            : Icons.lock_rounded,
                        color: leaf,
                        size: 18,
                      ),
                    ),
                    const SizedBox(width: 11),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            '${mission.id}  ·  ${mission.title}',
                            style: const TextStyle(
                              fontWeight: FontWeight.w800,
                              color: ink,
                              fontSize: 13,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            mission.description,
                            style: const TextStyle(
                              fontSize: 11,
                              color: mutedInk,
                              height: 1.35,
                            ),
                          ),
                          const SizedBox(height: 7),
                          Text(
                            complete
                                ? 'MISI SELESAI'
                                : unlocked
                                ? mission.rewardLabel
                                : 'Selesaikan misi sebelumnya',
                            style: const TextStyle(
                              fontSize: 9,
                              fontWeight: FontWeight.w900,
                              color: leaf,
                            ),
                          ),
                          if (selected && unlocked && !complete) ...[
                            const SizedBox(height: 4),
                            Text(
                              '$progress/${mission.objectives.length} LANGKAH SELESAI',
                              style: const TextStyle(
                                fontSize: 9,
                                fontWeight: FontWeight.w800,
                                color: mutedInk,
                              ),
                            ),
                          ],
                        ],
                      ),
                    ),
                    if (unlocked && !complete)
                      Icon(
                        selected
                            ? Icons.expand_less_rounded
                            : Icons.chevron_right_rounded,
                        color: mutedInk,
                      ),
                  ],
                ),
              ),
            ),
            if (selected && unlocked && !complete)
              Padding(
                padding: const EdgeInsets.fromLTRB(14, 0, 14, 14),
                child: Column(
                  children: List.generate(mission.objectives.length, (index) {
                    final done = index < progress;
                    final current = index == progress;
                    return Padding(
                      padding: const EdgeInsets.only(top: 7),
                      child: SizedBox(
                        width: double.infinity,
                        child: OutlinedButton(
                          key: ValueKey('task-${mission.id}-$index'),
                          onPressed: current
                              ? () => _completeObjective(mission)
                              : null,
                          style: OutlinedButton.styleFrom(
                            alignment: Alignment.centerLeft,
                            padding: const EdgeInsets.symmetric(
                              horizontal: 11,
                              vertical: 11,
                            ),
                            side: BorderSide(
                              color: current
                                  ? leaf
                                  : ink.withValues(alpha: 0.08),
                            ),
                            foregroundColor: ink,
                            backgroundColor: done
                                ? const Color(0xFFE8F3E1)
                                : Colors.white,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(11),
                            ),
                          ),
                          child: Row(
                            children: [
                              Icon(
                                done
                                    ? Icons.check_circle_rounded
                                    : current
                                    ? Icons.play_circle_rounded
                                    : Icons.circle_outlined,
                                size: 17,
                                color: done || current ? leaf : mutedInk,
                              ),
                              const SizedBox(width: 9),
                              Expanded(
                                child: Text(
                                  mission.objectives[index],
                                  style: const TextStyle(
                                    fontSize: 11,
                                    fontWeight: FontWeight.w700,
                                  ),
                                ),
                              ),
                              if (current)
                                const Text(
                                  'MULAI',
                                  style: TextStyle(
                                    color: leaf,
                                    fontWeight: FontWeight.w900,
                                    fontSize: 9,
                                  ),
                                ),
                            ],
                          ),
                        ),
                      ),
                    );
                  }),
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildCityPage() {
    final openCount = List.generate(
      gameZones.length,
      _isZoneUnlocked,
    ).where((open) => open).length;
    return ListView(
      padding: const EdgeInsets.fromLTRB(20, 18, 20, 28),
      children: [
        const Text('ATLAS TWIN CITY', style: _eyebrowStyle),
        const SizedBox(height: 5),
        const Text(
          'Dunia yang kamu bangun.',
          style: TextStyle(
            fontSize: 25,
            fontWeight: FontWeight.w800,
            color: ink,
          ),
        ),
        const SizedBox(height: 7),
        Text(
          '$openCount dari ${gameZones.length} zona telah terbuka.',
          style: const TextStyle(color: mutedInk, fontSize: 13),
        ),
        const SizedBox(height: 18),
        Container(
          height: 170,
          clipBehavior: Clip.antiAlias,
          decoration: BoxDecoration(
            color: forest,
            borderRadius: BorderRadius.circular(19),
          ),
          child: AnimatedBuilder(
            animation: _windController,
            builder: (context, child) => CustomPaint(
              painter: _CityPainter(
                rotation: _windController.value * math.pi * 2,
              ),
              child: const SizedBox.expand(),
            ),
          ),
        ),
        const SizedBox(height: 17),
        ...List.generate(gameZones.length, (index) {
          final zone = gameZones[index];
          final unlocked = _isZoneUnlocked(index);
          final missions = gameMissions.where(
            (mission) => mission.zone == zone.name,
          );
          final complete = missions
              .where((mission) => _completed.contains(mission.id))
              .length;
          return Container(
            margin: const EdgeInsets.only(bottom: 10),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(15),
              border: Border.all(color: ink.withValues(alpha: 0.07)),
            ),
            child: ListTile(
              onTap: unlocked ? () => _openZone(index) : null,
              leading: Container(
                width: 42,
                height: 42,
                decoration: BoxDecoration(
                  color: unlocked
                      ? const Color(0xFFE6F0DC)
                      : const Color(0xFFF0F0EB),
                  borderRadius: BorderRadius.circular(13),
                ),
                child: Icon(
                  unlocked ? zone.icon : Icons.lock_rounded,
                  color: unlocked ? leaf : mutedInk,
                  size: 21,
                ),
              ),
              title: Text(
                zone.name,
                style: const TextStyle(
                  color: ink,
                  fontSize: 13,
                  fontWeight: FontWeight.w800,
                ),
              ),
              subtitle: Text(
                unlocked
                    ? '$complete/${missions.length} misi selesai'
                    : 'Selesaikan zona sebelumnya',
                style: const TextStyle(color: mutedInk, fontSize: 11),
              ),
              trailing: Icon(
                unlocked
                    ? Icons.arrow_forward_ios_rounded
                    : Icons.lock_outline_rounded,
                size: 15,
                color: mutedInk,
              ),
            ),
          );
        }),
      ],
    );
  }

  Widget _buildProfilePage() {
    return ListView(
      padding: const EdgeInsets.fromLTRB(20, 24, 20, 28),
      children: [
        const Text('PROFIL PEMAIN', style: _eyebrowStyle),
        const SizedBox(height: 15),
        Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: forest,
            borderRadius: BorderRadius.circular(20),
          ),
          child: const Row(
            children: [
              CircleAvatar(
                radius: 30,
                backgroundColor: lime,
                child: Icon(Icons.engineering_rounded, color: forest, size: 30),
              ),
              SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Adit Twin',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 19,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                    SizedBox(height: 3),
                    Text(
                      'Insinyur Digital Twin  ·  Level 25',
                      style: TextStyle(color: Color(0xFFD9E6D4), fontSize: 11),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 18),
        _profileMetric('Pengalaman', '$_xp XP'),
        _profileMetric('Twin Point', '$_twinPoints TP'),
        _profileMetric('Koin', '$_coins'),
        _profileMetric('Cetak biru', '$_blueprints'),
        const SizedBox(height: 16),
        const Text(
          'Setiap misi menambah data dan cerita ke kota kembarmu.',
          style: TextStyle(color: mutedInk, fontSize: 13, height: 1.5),
        ),
      ],
    );
  }

  Widget _profileMetric(String label, String value) {
    return Container(
      margin: const EdgeInsets.only(bottom: 9),
      padding: const EdgeInsets.symmetric(horizontal: 15, vertical: 14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(13),
      ),
      child: Row(
        children: [
          Text(label, style: const TextStyle(color: mutedInk, fontSize: 13)),
          const Spacer(),
          Text(
            value,
            style: const TextStyle(
              color: ink,
              fontWeight: FontWeight.w800,
              fontSize: 13,
            ),
          ),
        ],
      ),
    );
  }
}

class _StatTile extends StatelessWidget {
  const _StatTile({
    required this.icon,
    required this.label,
    required this.value,
    required this.color,
  });

  final IconData icon;
  final String label;
  final String value;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(15),
        border: Border.all(color: ink.withValues(alpha: 0.06)),
      ),
      child: Row(
        children: [
          Container(
            width: 34,
            height: 34,
            decoration: BoxDecoration(
              color: color,
              borderRadius: BorderRadius.circular(11),
            ),
            child: Icon(icon, color: forest, size: 18),
          ),
          const SizedBox(width: 9),
          Expanded(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    color: mutedInk,
                    fontSize: 10,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 3),
                Text(
                  value,
                  style: const TextStyle(
                    color: ink,
                    fontSize: 14,
                    fontWeight: FontWeight.w800,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

const TextStyle _eyebrowStyle = TextStyle(
  color: mutedInk,
  fontSize: 9,
  fontWeight: FontWeight.w900,
  letterSpacing: 0.8,
);

class _CityPainter extends CustomPainter {
  const _CityPainter({required this.rotation});

  final double rotation;

  @override
  void paint(Canvas canvas, Size size) {
    final rect = Offset.zero & size;
    final sky = Paint()
      ..shader = const LinearGradient(
        colors: [Color(0xFF5A9A70), Color(0xFFBED58A)],
        begin: Alignment.topCenter,
        end: Alignment.bottomCenter,
      ).createShader(rect);
    canvas.drawRect(rect, sky);

    final sunPaint = Paint()..color = const Color(0xFFFFE69B);
    canvas.drawCircle(
      Offset(size.width * 0.78, size.height * 0.2),
      20,
      sunPaint,
    );
    canvas.drawCircle(
      Offset(size.width * 0.78, size.height * 0.2),
      28,
      Paint()..color = const Color(0xFFFFE69B).withValues(alpha: 0.18),
    );

    final backHill = Path()
      ..moveTo(0, size.height * 0.67)
      ..quadraticBezierTo(
        size.width * 0.26,
        size.height * 0.34,
        size.width * 0.52,
        size.height * 0.64,
      )
      ..quadraticBezierTo(
        size.width * 0.77,
        size.height * 0.37,
        size.width,
        size.height * 0.57,
      )
      ..lineTo(size.width, size.height)
      ..lineTo(0, size.height)
      ..close();
    canvas.drawPath(backHill, Paint()..color = const Color(0xFF4E8A61));

    final frontHill = Path()
      ..moveTo(0, size.height * 0.82)
      ..quadraticBezierTo(
        size.width * 0.28,
        size.height * 0.57,
        size.width * 0.58,
        size.height * 0.8,
      )
      ..quadraticBezierTo(
        size.width * 0.82,
        size.height * 0.57,
        size.width,
        size.height * 0.76,
      )
      ..lineTo(size.width, size.height)
      ..lineTo(0, size.height)
      ..close();
    canvas.drawPath(frontHill, Paint()..color = const Color(0xFF326B4D));

    _drawBuilding(
      canvas,
      Rect.fromLTWH(
        size.width * 0.13,
        size.height * 0.39,
        39,
        size.height * 0.33,
      ),
      const Color(0xFFF2C184),
      3,
      3,
    );
    _drawBuilding(
      canvas,
      Rect.fromLTWH(
        size.width * 0.25,
        size.height * 0.3,
        48,
        size.height * 0.43,
      ),
      const Color(0xFFE8D99E),
      3,
      4,
    );
    _drawBuilding(
      canvas,
      Rect.fromLTWH(
        size.width * 0.43,
        size.height * 0.43,
        36,
        size.height * 0.29,
      ),
      const Color(0xFFF2AE87),
      2,
      3,
    );
    _drawBuilding(
      canvas,
      Rect.fromLTWH(
        size.width * 0.56,
        size.height * 0.35,
        52,
        size.height * 0.38,
      ),
      const Color(0xFFD9E3AE),
      4,
      3,
    );

    _drawTurbine(
      canvas,
      Offset(size.width * 0.86, size.height * 0.45),
      size.height * 0.39,
    );
    _drawTurbine(
      canvas,
      Offset(size.width * 0.94, size.height * 0.55),
      size.height * 0.29,
    );

    final road = Paint()
      ..color = const Color(0xFF789B65)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 15
      ..strokeCap = StrokeCap.round;
    final roadPath = Path()
      ..moveTo(size.width * 0.16, size.height)
      ..cubicTo(
        size.width * 0.26,
        size.height * 0.74,
        size.width * 0.52,
        size.height * 0.99,
        size.width * 0.69,
        size.height * 0.76,
      );
    canvas.drawPath(roadPath, road);

    final dashPaint = Paint()
      ..color = const Color(0xFFEFE7B4)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.5;
    final dashPath = Path()
      ..moveTo(size.width * 0.2, size.height * 0.91)
      ..cubicTo(
        size.width * 0.3,
        size.height * 0.76,
        size.width * 0.52,
        size.height * 0.94,
        size.width * 0.65,
        size.height * 0.79,
      );
    canvas.drawPath(dashPath, dashPaint);
  }

  void _drawBuilding(
    Canvas canvas,
    Rect rect,
    Color color,
    int columns,
    int rows,
  ) {
    final body = RRect.fromRectAndRadius(rect, const Radius.circular(5));
    canvas.drawRRect(body, Paint()..color = color);
    final windowPaint = Paint()
      ..color = const Color(0xFF52775A).withValues(alpha: 0.76);
    final gapX = rect.width / (columns + 1);
    final gapY = rect.height / (rows + 1);
    for (var row = 0; row < rows; row++) {
      for (var column = 0; column < columns; column++) {
        final center = Offset(
          rect.left + gapX * (column + 1),
          rect.top + gapY * (row + 1),
        );
        canvas.drawRRect(
          RRect.fromRectAndRadius(
            Rect.fromCenter(center: center, width: 4, height: 6),
            const Radius.circular(1.5),
          ),
          windowPaint,
        );
      }
    }
  }

  void _drawTurbine(Canvas canvas, Offset hub, double poleHeight) {
    final polePaint = Paint()
      ..color = const Color(0xFFF4F6D8)
      ..strokeWidth = 2.3
      ..strokeCap = StrokeCap.round;
    final poleTop = Offset(hub.dx, hub.dy + 7);
    canvas.drawLine(
      poleTop,
      Offset(hub.dx - 3, hub.dy + poleHeight),
      polePaint,
    );
    canvas.save();
    canvas.translate(hub.dx, hub.dy);
    canvas.rotate(rotation);
    for (var blade = 0; blade < 3; blade++) {
      canvas.save();
      canvas.rotate(blade * math.pi * 2 / 3);
      final path = Path()
        ..moveTo(0, -2)
        ..quadraticBezierTo(-3, -13, -2, -22)
        ..quadraticBezierTo(0, -27, 2, -22)
        ..quadraticBezierTo(4, -11, 2, -2)
        ..close();
      canvas.drawPath(path, polePaint);
      canvas.restore();
    }
    canvas.drawCircle(
      Offset.zero,
      3.2,
      Paint()..color = const Color(0xFFF4F6D8),
    );
    canvas.restore();
  }

  @override
  bool shouldRepaint(covariant _CityPainter oldDelegate) =>
      oldDelegate.rotation != rotation;
}
