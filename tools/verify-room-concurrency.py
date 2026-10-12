#!/usr/bin/env python3
"""Run against a disposable migrated DB using psql's PG* connection variables.

Two sessions compete for the last seat with different unused tracks. Checks
both join_room and direct inserts (the capacity trigger). Deletes only the
random fixture visitors/rooms this script creates, including on failure.
"""
import json
import os
import subprocess
import time
import uuid

PSQL = ["psql", "-XqAt", "-v", "ON_ERROR_STOP=1"]


def query(sql):
    return subprocess.run(PSQL, input=sql, text=True, capture_output=True, check=True).stdout.strip()


def verify(direct_insert):
    ids = [str(uuid.uuid4()) for _ in range(5)]
    tokens = [str(uuid.uuid4()) for _ in ids]
    sessions = []
    label = "trigger" if direct_insert else "join RPC"
    try:
        for index, (visitor, token) in enumerate(zip(ids, tokens)):
            query(f"select public.claim_visitor('{visitor}', '{token}', 'Race {index}');")
        room = json.loads(query(
            f"select row_to_json(public.create_room('{ids[0]}', '{tokens[0]}', 'Race Crew', 'software-engineering'));"
        ))
        for index, track in [(1, "ai"), (2, "web-development")]:
            query(f"select public.join_room('{ids[index]}', '{tokens[index]}', '{room['join_code']}', '{track}');")

        def join(index, track):
            if direct_insert:
                return ("insert into public.room_members (room_id, visitor_id, track_id) "
                        f"values ('{room['id']}', '{ids[index]}', '{track}');")
            return ("set role anon; "
                    f"select public.join_room('{ids[index]}', '{tokens[index]}', '{room['join_code']}', '{track}');")

        first = subprocess.Popen(PSQL, stdin=subprocess.PIPE, stdout=subprocess.PIPE,
                                 stderr=subprocess.PIPE, text=True)
        sessions.append(first)
        first.stdin.write(f"begin; {join(3, 'data-science')}\n\\echo SEAT_HELD\n")
        first.stdin.flush()
        # psql flushes stdout for \echo. This proves the first join is complete
        # but still uncommitted before the second transaction begins.
        while first.stdout.readline().strip() != "SEAT_HELD":
            if first.poll() is not None:
                raise AssertionError(first.stderr.read())

        app_name = "gdg-room-race-" + str(uuid.uuid4())
        second = subprocess.Popen(PSQL, stdin=subprocess.PIPE, stdout=subprocess.PIPE,
                                  stderr=subprocess.PIPE, text=True,
                                  env={**os.environ, "PGAPPNAME": app_name})
        sessions.append(second)
        second.stdin.write(join(4, 'cybersecurity') + "\n")
        second.stdin.close()
        second.stdin = None

        deadline = time.monotonic() + 10
        while query(f"select count(*) from pg_stat_activity where application_name = '{app_name}' and wait_event_type = 'Lock';") != "1":
            if second.poll() is not None or time.monotonic() > deadline:
                raise AssertionError(f"{label}: competing join did not wait for the room lock")
            time.sleep(0.05)

        first.stdin.write("commit;\n")
        first.stdin.flush()
        _, first_error = first.communicate(timeout=10)
        _, second_error = second.communicate(timeout=10)
        assert first.returncode == 0, first_error
        assert second.returncode != 0 and "room_full" in second_error, second_error
        assert query(f"select count(*) from public.room_members where room_id = '{room['id']}';") == "4"
        print(f"PASS: {label} serializes last-seat joins and refuses the fifth member")
    finally:
        for session in sessions:
            if session.poll() is None:
                session.terminate()
                session.wait(timeout=10)
        query("delete from public.visitors where id in (" + ",".join(f"'{value}'" for value in ids) + ");")


if __name__ == "__main__":
    verify(False)
    verify(True)
