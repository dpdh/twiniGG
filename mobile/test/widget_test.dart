// This is a basic Flutter widget test.
//
// To perform an interaction with a widget in your test, use the WidgetTester
// utility in the flutter_test package. For example, you can send tap and scroll
// gestures. You can also use WidgetTester to find child widgets in the widget
// tree, read text, and verify that the values of widget properties are correct.

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:twinki_city_mobile/main.dart';

const MethodChannel gameSaveChannel = MethodChannel('com.twinkicity/game_save');
String? savedGame;

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  final messenger =
      TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger;

  setUp(() {
    savedGame = null;
    messenger.setMockMethodCallHandler(gameSaveChannel, (call) async {
      if (call.method == 'load') return savedGame;
      if (call.method == 'save') {
        savedGame = call.arguments as String;
        return true;
      }
      return null;
    });
  });

  tearDown(() => messenger.setMockMethodCallHandler(gameSaveChannel, null));

  testWidgets('beranda menampilkan kampanye dan progres kota', (tester) async {
    await tester.pumpWidget(const TwinkiCityApp());
    expect(find.text('Kota tumbuh saat kamu bergerak.'), findsOneWidget);
    expect(find.text('Kenalan dengan Twinki'), findsOneWidget);
  });

  testWidgets('objektif misi menaikkan progres', (tester) async {
    await tester.pumpWidget(const TwinkiCityApp());
    await tester.tap(find.text('Misi').last);
    await tester.pump(const Duration(milliseconds: 250));
    await tester.tap(find.byKey(const ValueKey('task-TV-001-0')));
    await tester.pump(const Duration(milliseconds: 250));

    expect(find.text('1/3 LANGKAH SELESAI'), findsOneWidget);
  });

  testWidgets('progres misi dipulihkan setelah aplikasi dibuka ulang', (
    tester,
  ) async {
    await tester.pumpWidget(const TwinkiCityApp());
    await tester.tap(find.text('Misi').last);
    await tester.pump(const Duration(milliseconds: 250));
    await tester.tap(find.byKey(const ValueKey('task-TV-001-0')));
    await tester.pump(const Duration(milliseconds: 250));
    await tester.pump(const Duration(milliseconds: 50));

    expect(savedGame, isNotNull);
    await tester.pumpWidget(const SizedBox());
    await tester.pumpWidget(const TwinkiCityApp());
    await tester.pump(const Duration(milliseconds: 50));

    expect(find.text('1/3 LANGKAH'), findsOneWidget);
  });
}
